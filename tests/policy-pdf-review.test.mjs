import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePolicyPdfDocument, planPolicyPdfOcr } from '../src/lib/policyPdfDocument.ts';
import { validatePolicyPdfSelection } from '../src/lib/policyPdfFields.ts';
import { choosePolicyPdfReading, policyPdfOcrText } from '../src/lib/policyPdfReader.ts';

const text = 'Sigortalı Bilgileri\nAdı Soyadı: DENİZ ÖRNEK\nPoliçe No: 00012345\nSigorta Şirketi: Örnek Sigorta\nSigorta Türü: Konut\nBaşlangıç Tarihi: 03/06/2026\nBitiş Tarihi: 03/06/2027\nBrüt Prim: 1.200,00';
const page = (number, body = text, extra = {}) => ({ number, text: body, method: 'text', warnings: [], ...extra });

test('document review locates source pages and reports missing core fields', () => {
  const review = analyzePolicyPdfDocument({ pages: [page(1, 'Reklam kapak'), page(2)], warnings: [] });
  assert.equal(review.fields.customerName, 'DENİZ ÖRNEK');
  assert.equal(review.evidence.customerName.page, 2);
  assert.deepEqual(review.missingFields, []);
  const incomplete = analyzePolicyPdfDocument({ pages: [page(1, 'Poliçe No: 00012345')], warnings: [] });
  assert.ok(incomplete.missingFields.includes('customerName'));
});

test('different policy pages cannot silently mix a customer and another premium', () => {
  const document = { pages: [page(1), page(2, text.replaceAll('00012345', '00098765').replace('DENİZ ÖRNEK', 'ŞULE IŞIK'))], warnings: [] };
  assert.equal(analyzePolicyPdfDocument(document).multiplePolicies, true);
  const selected = analyzePolicyPdfDocument(document, 2);
  assert.equal(selected.multiplePolicies, false);
  assert.equal(selected.fields.customerName, 'ŞULE IŞIK');
  assert.equal(selected.fields.policyNo, '00098765');
});

test('same policy number repeated on different pages is not a multi-policy file', () => {
  const review = analyzePolicyPdfDocument({ pages: [page(1), page(2, 'Poliçe No: 00012345')], warnings: [] });
  assert.equal(review.multiplePolicies, false);
});

test('two explicit policy numbers on the same page also prevent mixed transfer', () => {
  const review = analyzePolicyPdfDocument({ pages: [page(1, 'Poliçe No: 00012345\nPoliçe No: 00098765')], warnings: [] });
  assert.equal(review.multiplePolicies, true);
});

test('OCR/native disagreement is exposed as choices instead of an overwrite', () => {
  const review = analyzePolicyPdfDocument({ pages: [page(1, text, { alternativeText: text.replace('00012345', '00012348') })], warnings: [] });
  assert.equal(review.fields.policyNo, undefined);
  assert.equal(review.choices.policyNo.length, 2);
  assert.ok(review.fieldIssues.policyNo.length);
  assert.equal(review.multiplePolicies, false);
});

test('low OCR quality and inconsistent money require explicit field review', () => {
  const review = analyzePolicyPdfDocument({ pages: [page(1, text + '\nNet Prim: 2.000,00', { method: 'ocr', ocrConfidence: 60 })], warnings: [] });
  assert.ok(review.fieldIssues.customerName.length);
  assert.ok(review.fieldIssues.netPremium[0].includes('brüt'));
});

test('OCR planner retries relevant searchable pages without scanning all legal text', () => {
  const pages = [text.replace('Adı Soyadı', 'A d ı / S o y a d ı'), 'Genel sözleşme koşulları '.repeat(200), 'Hasar ve ihbar şartları '.repeat(200)];
  assert.deepEqual(planPolicyPdfOcr(pages, [false, false, false]), [0]);
  assert.deepEqual(planPolicyPdfOcr(['', text], [true, false]), []);
  assert.deepEqual(planPolicyPdfOcr(pages, [false, false, false], true), [0, 1, 2]);
});

test('selection edits normalize dates and reject invalid values before form transfer', () => {
  const valid = validatePolicyPdfSelection({ startDate: '3/6/2026', customerName: 'DENİZ ÖRNEK', premium: '1.200,00' });
  assert.equal(valid.fields.startDate, '2026-06-03');
  assert.deepEqual(valid.issues, {});
  const invalid = validatePolicyPdfSelection({ startDate: '31.02.2026', customerTc: '*****1234', policyNo: 'EK', premium: '-1.000', customerPhone: 'abc' });
  assert.equal(Object.keys(invalid.issues).length, 5);
  assert.ok(validatePolicyPdfSelection({ premium: '900', netPremium: '1.200' }).issues.netPremium);
});

test('wrapped company suffixes are joined without swallowing an address', () => {
  const review = analyzePolicyPdfDocument({ pages: [page(1, 'Sigortalı Bilgileri\nAdı Soyadı/Unvanı:\nÖRNEK GIDA\nSANAYİ VE TİCARET\nLİMİTED ŞİRKETİ\nAdresi: Örnek Mahallesi')], warnings: [] });
  assert.equal(review.fields.customerName, 'ÖRNEK GIDA SANAYİ VE TİCARET LİMİTED ŞİRKETİ');
  assert.ok(review.evidence.customerName.source.includes('ÖRNEK GIDA'));
  assert.ok(review.evidence.customerName.source.includes('LİMİTED ŞİRKETİ'));
  assert.equal(review.evidence.customerName.source.includes('Adresi'), false);
});

test('unrelated text below a name does not become part of the customer name', () => {
  const review = analyzePolicyPdfDocument({ pages: [page(1, 'Adı Soyadı/Unvanı: DENİZ ÖRNEK\nÖRNEK MAHALLESİ\nPoliçe No: 00012345')], warnings: [] });
  assert.equal(review.fields.customerName, 'DENİZ ÖRNEK');
});

test('better OCR can recover fields but not discard useful searchable content on a tie', () => {
  assert.equal(choosePolicyPdfReading('Başlık metni', text).method, 'ocr');
  assert.equal(choosePolicyPdfReading(text, '').text, text);
  assert.equal(choosePolicyPdfReading(text, 'Yanlış eksik metin').method, 'text');
});

test('OCR block coordinates recover a label/value relationship across draw order', () => {
  const data = { text: 'Eksik düz metin', confidence: 90, blocks: [{ paragraphs: [{ lines: [
    { bbox: { y0: 20, y1: 40 }, words: [{ text: 'DENİZ', bbox: { x0: 400, x1: 470 } }, { text: 'ÖRNEK', bbox: { x0: 480, x1: 550 } }] },
    { bbox: { y0: 20, y1: 40 }, words: [{ text: 'Adı Soyadı/Unvanı', bbox: { x0: 20, x1: 220 } }] },
  ] }] }] };
  assert.equal(policyPdfOcrText(data), 'Adı Soyadı/Unvanı\tDENİZ ÖRNEK');
});
