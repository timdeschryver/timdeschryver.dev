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

Optimizing your images is important to have faster website and a good user experience.
For my blog, I used to use the [Image Optimizer](https://github.com/marketplace/actions/image-optimizer) Github Action to optimize my images.

The downside to this approach was that the optimization was only performed on Pull Requests. When I'm publishing a new blog post, I usually just pushed to the `main` branch, thus new images wouldn't be optimized. As a counter measurement, I also used [Squoosh](https://squoosh.app/) to optimize the banner images as this was mostly the only image I used.

This task was done manually, every. single. time.
Until I stumbled onto the [Squoosh lib](https://www.npmjs.com/package/@squoosh/lib).
Let's take a look at how we can automate this threaded task and optimize our images with ease!

I'm assuming you're already using [lint-staged](https://github.com/okonet/lint-staged) to some extent, for example, to run a linter or prettier on touched files. We extend the `lint-staged` configuration to run an optimization to images (`*.{jpg,jpeg,png,gif}`), and re-add them to our commit with `git add`.

```json{3}:package.json
{
	"lint-staged": {
		"*.{jpg,jpeg,png,gif}": ["node ./scripts/optimize-image.js", "git add"]
	}
}
```

To run `lint-staged` as a pre-commit step, I'm using [husky](https://typicode.github.io/husky/#/) with a `pre-commit` git hook.

The `optimize-image.js` script, passes the image through Squoosh to optimize the image.
Note that we don't need to pass an argument to this script, because lint-staged already passes the file's path as an argument.

> If the [Squoosh CLI](https://www.npmjs.com/package/@squoosh/cli) would overwrite the initial image (or have a config flag for it), we could have simply executed the Squoosh CLI without the need to create a custom script for it.

```js:optimize-image.js
import { writeFileSync } from 'fs';
import { ImagePool } from '@squoosh/lib';

const imagePool = new ImagePool();
const [img] = process.argv.slice(2);

const image = imagePool.ingestImage(img);
await image.encode({
	mozjpeg: {}
});
const { binary } = await image.encodedWith.mozjpeg;
await writeFileSync(img, binary);
await imagePool.close();
```

And that's it, with some configuration and just a couple lines of code, all of the images on my blog will be optimized.

The profit is that I save a couple of minutes every time I add images, and visitors don't need to download the whole image.
