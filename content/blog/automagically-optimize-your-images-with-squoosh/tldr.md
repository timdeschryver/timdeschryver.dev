To optimze images in a new project, follow these steps.

## Install dependencies

```sh
npm install --save-dev @squoosh/cli husky lint-staged
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

Invoke Squoosh on the image.

```js:optimize-image.js
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
