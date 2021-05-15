import { execSync } from 'child_process';
import { dirname } from 'path';
import { writeFileSync } from 'fs';

const [img] = process.argv.slice(2);

try {
	execSync(`npx @squoosh/cli --mozjpeg auto --output-dir "${dirname(img)}" "${img}"`);
} catch (err) {
	writeFileSync('optimize-image.log', err.message, { encoding: 'utf8', flag: 'w' });
}
