To optimze images in a new project, follow these steps.

## Install dependencies

```sh
npm install --save-dev @squoosh/lib husky lint-staged
```

## Configure husky

Initialize [husky](https://github.com/typicode/husky)

```sh
npx husky-init
```

This does also create `./husky/pre-commit` file, that we modify to run a `pre-commit` script.

```sh
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run pre-commit
```

## Configure package.json

```json:package.json
{
	"scripts": {
		"pre-commit": "lint-staged"
	}
}
```

## Configure lint-staged

Configure [lint-staged](https://github.com/okonet/lint-staged) to minify images.

```json
{
	"scripts": {
		"pre-commit": "lint-staged",
		"optimize:image": "node ./scripts/optimize-image.js",
	}
	"lint-staged": {
		"*.{jpg,jpeg,png,gif}": ["npm run optimize:image", "git add"]
	}
}
```

## Creating optimize-image.js

Invoke [Squoosh](https://github.com/GoogleChromeLabs/squoosh/tree/dev/libsquoosh#libsquoosh) on the image.

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
