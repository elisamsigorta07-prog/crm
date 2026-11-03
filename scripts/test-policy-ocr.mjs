// Real local OCR smoke tests with generated images, no customer documents,
// no network calls and no persistent test-image or language-cache files.
import assert from 'node:assert/strict';
import path from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import { createWorker } from 'tesseract.js';
import { policyPdfOcrText } from '../src/lib/policyPdfReader.ts';
import { extractPolicyPdfFields } from '../src/lib/policyPdfFields.ts';

const canvas = createCanvas(2000, 1000);
const context = canvas.getContext('2d');
const worker = await createWorker('tur+eng', 1, { langPath: path.resolve('public/vendor/tesseract/lang'), cacheMethod: 'none' });
try {
  for (const style of ['rows', 'columns', 'small', 'rotated', 'low-contrast', 'reversed-columns']) {
    context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = style === 'low-contrast' ? '#888888' : '#111111'; context.font = `${style === 'small' ? 26 : 34}px Arial`;
    context.save();
    if (style === 'rotated') { context.translate(1000, 500); context.rotate(2 * Math.PI / 180); context.translate(-1000, -500); }
    if (style === 'columns' || style === 'reversed-columns') {
      const reversed = style === 'reversed-columns';
      context.fillText(reversed ? 'SIGORTALI' : 'SIGORTA ETTIREN', 50, 80); context.fillText(reversed ? 'SIGORTA ETTIREN' : 'SIGORTALI', 1100, 80);
      context.fillText(`Adı/Unvanı: ${reversed ? 'DENİZ ÖRNEK' : 'BAŞKA KİŞİ'}`, 50, 160); context.fillText(`Adı/Unvanı: ${reversed ? 'BAŞKA KİŞİ' : 'DENİZ ÖRNEK'}`, 1100, 160);
    } else {
      context.fillText('Sigortali Bilgileri', 50, 80);
      context.fillText('Adı Soyadı/Unvanı:', 50, 160); context.fillText('DENİZ ÖRNEK', 650, 160);
    }
    context.fillText('Police No:', 50, 300); context.fillText('000123456789', 650, 300);
    context.fillText('Baslangic Tarihi:', 50, 400); context.fillText('03.06.2026', 650, 400);
    context.fillText('Bitis Tarihi:', 50, 500); context.fillText('03.06.2027', 650, 500);
    context.fillText('Brut Prim:', 50, 600); context.fillText('12.345,67 TL', 650, 600);
    context.restore();
    const result = await worker.recognize(canvas.toBuffer('image/png'), { rotateAuto: true }, { text: true, blocks: true });
    const text = policyPdfOcrText(result.data);
    const fields = extractPolicyPdfFields(text).fields;
    assert.equal(fields.customerName, 'DENİZ ÖRNEK', `${style}: name\n${text}`);
    assert.equal(fields.policyNo, '000123456789', `${style}: policy number\n${text}`);
    assert.equal(fields.startDate, '2026-06-03', `${style}: start date\n${text}`);
    assert.equal(fields.endDate, '2027-06-03', `${style}: end date\n${text}`);
    assert.equal(fields.premium, '12.345,67', `${style}: premium\n${text}`);
    console.log(`${style}: real OCR recovered 5 expected fields; recognition quality ${result.data.confidence.toFixed(1)}.`);
  }
} finally { await worker.terminate(); }
