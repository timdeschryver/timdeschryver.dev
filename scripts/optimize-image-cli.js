import { optimizeImage } from './optimize-image.js';

const [img] = process.argv.slice(2);
await optimizeImage(img);
