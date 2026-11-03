// Local diagnostic: never uploads a PDF or writes its personal data into fixtures.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { reconstructPolicyPdfText } from '../src/lib/policyPdfReader.ts';
import { extractPolicyPdfFields } from '../src/lib/policyPdfFields.ts';

const filename = process.argv[2];
if (!filename) throw new Error('Usage: node scripts/inspect-policy-pdf.mjs <local.pdf>');
const base = new URL('../node_modules/pdfjs-dist/', import.meta.url);
const task = pdfjs.getDocument({
  data: new Uint8Array(await readFile(filename)),
  standardFontDataUrl: fileURLToPath(new URL('standard_fonts/', base)).replaceAll('\\', '/'),
  cMapUrl: fileURLToPath(new URL('cmaps/', base)).replaceAll('\\', '/'), cMapPacked: true,
});
try {
  const pdf = await task.promise;
  if (pdf.numPages > 30) throw new Error('Maximum 30 pages.');
  const pages = [];
  for (let number = 1; number <= pdf.numPages; number++) {
    const page = await pdf.getPage(number);
    const content = await page.getTextContent();
    pages.push(reconstructPolicyPdfText(content.items.filter(item => 'str' in item)));
    page.cleanup();
  }
  const result = extractPolicyPdfFields(pages.join('\n\n'));
  console.log(JSON.stringify({ pages: pdf.numPages, documentKind: result.documentKind, fieldCount: Object.keys(result.fields).length, fields: Object.keys(result.fields), warnings: result.warnings }, null, 2));
} finally { await task.destroy(); }
