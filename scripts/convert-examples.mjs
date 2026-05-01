import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(__dirname, '..', 'public', 'img');

const inputs = [
  { src: 'example-before-1.jpg', out: 'example-before-1.webp', quality: 80, width: 960 },
  { src: 'example-before-2.jpg', out: 'example-before-2.webp', quality: 80, width: 960 },
  { src: 'example-after-1.png',  out: 'example-after-1.webp',  quality: 82, width: 960 },
  { src: 'example-after-2.png',  out: 'example-after-2.webp',  quality: 82, width: 960 },
  { src: 'logo.png',             out: 'logo.webp',             quality: 90, width: 128 },
];

for (const { src, out, quality, width } of inputs) {
  const inPath  = path.join(pub, src);
  const outPath = path.join(pub, out);
  const { width: w, height: h, format } = await sharp(inPath).metadata();
  await sharp(inPath)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toFile(outPath);
  const { size: outSz } = await sharp(outPath).metadata();
  console.log(`✓  ${src.padEnd(28)} ${format} ${w}×${h}  →  ${out} (q${quality}, max ${width}px wide)`);
}
