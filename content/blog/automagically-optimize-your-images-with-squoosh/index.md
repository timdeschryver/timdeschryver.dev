---
title: Automagically optimize your images with Squoosh
slug: automagically-optimize-your-images-with-squoosh
description: Minify images as a pre-commit step with Squoosh, husky, and lint-staged
author: Tim Deschryver
date: 2021-05-17
tags: blog, tools, optimization, node
banner: ./images/banner.jpg
published: true
---

For my blog, I used to use the [Image Optimizer](https://github.com/marketplace/actions/image-optimizer) Github Action to optimize my images.

The downside to this approach was that the optimization was only performed on Pull Requests. When I'm publishing a new blog post, I usually just pushed to the `main` branch, thus new images wouldn't be optimized. As a counter measurement, I also used [Squoosh](https://squoosh.app/) to optimize the banner images as this was mostly the only image I used.

This task was done manually, every. single. time.
Until I stumbled onto the [Squoosh CLI](https://www.npmjs.com/package/@squoosh/cli).
Let's take a look at how we can automate this threaded task and optimize our images with ease!

I'm assuming you're already using [lint-staged](https://github.com/okonet/lint-staged) to some extent, for example, to run a linter or prettier on touched files. We extend the `lint-staged` configuration to run an optimization to images (`*.{jpg,jpeg,png,gif}`), and re-add them to our commit with `git add`.

```json{6-9}:package.json
{
	"lint-staged": {
		"*.{js,ts,json,svelte}": ["eslint --fix", "git add"],
		"*.{prettier}": ["prettier --write", "git add"],
		"*.{jpg,jpeg,png,gif}": ["node ./scripts/optimize-image.js", "git add"]
	}
}
```

To run `lint-staged` as a pre-commit step, I'm using [husky](https://typicode.github.io/husky/#/) with a `pre-commit` git hook.

The `optimize-image.js` script, executes the Squoosh CLI to optimize the image.
Note that we don't need to pass an argument to this script, because lint-staged already passes the file's location as an argument.

The reason why we need a custom script is because we need to pass the image path to the Squoosh CLI twice. Once to specify the output directory, and the second time as the argument to be optimized. In this case, we just want to overwrite the original image, so we use the `dirname` method to get the directory of te image.

If the Squoosh CLI would overwrite the initial image (or have a config flag for it), we could have simply executed the Squoosh CLI without the need to create a custom script for it.

```js
import { execSync } from 'child_process';
import { dirname } from 'path';
import { writeFileSync } from 'fs';

const [img] = process.argv.slice(2);

try {
	execSync(`npx @squoosh/cli --mozjpeg auto --output-dir "${dirname(img)}" "${img}"`);
} catch (err) {
	writeFileSync('optimize-image.log', err.message, { encoding: 'utf8', flag: 'w' });
}
```

> I'm using the auto optimizer, if you want to tweak the arguments take a look at the [options](https://www.npmjs.com/package/@squoosh/cli).

And that's it, with some configuration and just a couple lines of code, all of the images on my blog will be optimized.

The profit is that I save a couple of minutes every time I add images, and visitors don't need to download the whole image.
