import { mkdir, copyFile, cp, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const vendor = path.join(root, 'public/vendor');
await mkdir(path.join(vendor, 'tesseract/core'), { recursive: true });
await mkdir(path.join(vendor, 'tesseract/lang'), { recursive: true });
for (const language of ['tur', 'eng']) {
  await copyFile(path.join(root, 'node_modules/@tesseract.js-data', language, '4.0.0_best_int', `${language}.traineddata.gz`), path.join(vendor, 'tesseract/lang', `${language}.traineddata.gz`));
}
await copyFile(path.join(root, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs'), path.join(vendor, 'pdf.worker.min.mjs'));
for (const [source, target] of [['cmaps', 'pdf-cmaps'], ['standard_fonts', 'pdf-fonts'], ['wasm', 'pdf-wasm']]) {
  await cp(path.join(root, 'node_modules/pdfjs-dist', source), path.join(vendor, target), { recursive: true });
}
await copyFile(path.join(root, 'node_modules/tesseract.js/dist/worker.min.js'), path.join(vendor, 'tesseract/worker.min.js'));
const core = path.join(root, 'node_modules/tesseract.js-core');
for (const file of await readdir(core)) {
  if (/\.wasm(?:\.js)?$/.test(file)) await copyFile(path.join(core, file), path.join(vendor, 'tesseract/core', file));
}
console.log('PDF ve OCR tarayıcı dosyaları hazır.');
