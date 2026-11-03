import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePolicyPdfFields, extractPolicyPdfFields } from '../src/lib/policyPdfFields.ts';
import { validatePolicyPdf, reconstructPolicyPdfText, policyPageNeedsOcr, isSkippablePolicyCover } from '../src/lib/policyPdfReader.ts';

test('Turkish policy fields retain leading zeros and normalize separate dates', () => {
  assert.deepEqual(parsePolicyPdfFields(`SİGORTALI ADI SOYADI: Örnek Müşteri
T.C. KİMLİK NO: 12345678901
Sigortalı Cep Telefonu: 0532 000 00 00
Poliçe Numarası: 00001234/1
Sigorta Şirketi: Örnek Sigorta
Sigorta Türü: Kasko
Başlangıç Tarihi: 28.10.2026
Bitiş Tarihi: 28/10/2027
Brüt Prim: 12.345,67 TL
Net Prim: 10.000,00 TL
Plaka: 07 ABC 123`), {
    customerName: 'Örnek Müşteri', customerTc: '12345678901', customerPhone: '0532 000 00 00',
    policyNo: '00001234/1', company: 'Örnek Sigorta', type: 'Kasko',
    startDate: '2026-10-28', endDate: '2027-10-28', premium: '12.345,67', netPremium: '10.000,00', plate: '07 ABC 123',
  });
});

test('alternate layout supports values below labels and neighboring fields', () => {
  const fields = parsePolicyPdfFields(`Sigortalı Unvanı
Örnek Ticaret Ltd.
Vergi Numarası: 0012345678
Poliçe No: 0000456  Başlangıç Tarihi: 2026-10-28
Bitiş Tarihi
28-10-2027
Ruhsat Seri No: AB123456`);
  assert.equal(fields.customerName, 'Örnek Ticaret Ltd.');
  assert.equal(fields.customerTc, '0012345678');
  assert.equal(fields.policyNo, '0000456');
  assert.equal(fields.startDate, '2026-10-28');
  assert.equal(fields.endDate, '2027-10-28');
  assert.equal(fields.documentSerial, 'AB123456');
});

test('does not mistake an agent or policyholder for the insured customer', () => {
  const fields = parsePolicyPdfFields(`Acente: Örnek Acente
Telefon: 0242 000 00 00
Sigorta Ettiren: Başka Kişi
Sigortalı Adı Soyadı: Sigortalı Kişi
Düzenleme Tarihi: 20.10.2026`);
  assert.deepEqual(fields, { customerName: 'Sigortalı Kişi' });
});

test('conflicting repeated fields and masked identifiers are left for review', () => {
  const fields = parsePolicyPdfFields(`Sigortalı: Birinci Kişi
Sigortalı: İkinci Kişi
TCKN: 123******01
GSM: acente telefonu
Başlangıç Tarihi: 31.02.2026
Bitiş Tarihi: 29.02.2027`);
  assert.deepEqual(fields, {});
});

test('a missing value never consumes the next field label', () => {
  assert.deepEqual(parsePolicyPdfFields('Poliçe No:\nBaşlangıç Tarihi: 01.01.2026'), { startDate: '2026-01-01' });
});

test('PDF validation checks content, size and file type', async () => {
  await validatePolicyPdf(new File(['%PDF-1.7\nexample'], 'policy.pdf', { type: 'application/pdf' }));
  await assert.rejects(validatePolicyPdf(new File(['not a pdf'], 'policy.pdf', { type: 'application/pdf' })), /geçerli/);
  await assert.rejects(validatePolicyPdf(new File([], 'empty.pdf')), /boş/);
  await assert.rejects(validatePolicyPdf(new File(['%PDF-1.7'], 'policy.exe')), /PDF dosyası/);
  await assert.rejects(validatePolicyPdf(new File([new Uint8Array(20 * 1024 * 1024 + 1)], 'large.pdf')), /20 MB/);
});

// Synthetic fixtures retain the layout issues found in a supplied PDF without
// committing the customer's file, real identity, address or policy number.
test('column layout, combined dates and a reference policy stay distinct', () => {
  const result = extractPolicyPdfFields(`Süper Konut Sigortası Poliçesi
Poliçe Bilgileri
Poliçe No\t00000001234\tEk/Yenileme No\t0/1
Başlangıç-Bitiş Tarihi\t03/06/2026-03/06/2027\tDüzenleme Tarihi ve Saati\t01/06/2026 15:41
Şirket Bilgileri
Sigorta Şirketi Ünvanı\tÖRNEK SİGORTA A.Ş.
Sigorta Aracısı Ünvanı\tÖRNEK ACENTE LTD.
Sigortalı/Sigorta Ettiren Bilgileri
Ad Soyad / Ünvan\tÖRNEK KİŞİ
T.C.Kimlik No\t*******1234
E-posta, GSM\tor***@****** 905*********
Risk Bilgileri
Bina m² (Brüt)\t200\tDask Poliçe Numarası\t00009999
DASK Poliçe Bitiş Tarihi\t05/06/2027
SBM Poliçe Numarası\t00007777
Sigortalı Statüsü\tMAL SAHİBİ
Prim Bilgileri
Net Prim\t2.000,00 TL\t1.Taksit\t03/07/2026\t400,00 TL
Toplam Ödenecek Prim\t2.400,00 TL\t2.Taksit\t03/08/2026\t400,00 TL
Teminatlar
Teminat Adı\tBedeli\tNet Prim (TL)
Yangın\t800.000,00 TL\t1.000,00
Sigortalı bina civarında başlayan kazılardan doğan zararlar hariçtir.
sigorta şirketi teklifi revize etme hakkını saklı tutar.
Sigorta Ettiren / Sigortalı\tSigorta Aracısı\tSigortacı
ÖRNEK KİŞİ\tÖRNEK ACENTE LTD.\tÖRNEK SİGORTA A.Ş.
Telefon No: 905320000000
E-posta: agency@example.test`);
  assert.deepEqual(result.fields, {
    type: 'Konut', policyNo: '00000001234', startDate: '2026-06-03', endDate: '2027-06-03',
    company: 'ÖRNEK SİGORTA A.Ş.', customerName: 'ÖRNEK KİŞİ', netPremium: '2.000,00', premium: '2.400,00',
  });
  assert.equal(result.warnings.filter(warning => warning.includes('maskelenmiş')).length, 3);
  assert.match(result.sources.customerName, /Ad Soyad \/ Ünvan/);
});

test('separate first/last name fields belong to the insured section', () => {
  const fields = parsePolicyPdfFields(`Acente Bilgileri
Ad Soyad: Acente Yetkilisi
Sigorta Ettiren Bilgileri
Ad Soyad: Başka Kişi
Sigortalı Bilgileri
Adı: Deniz
Soyadı: Örnek
Poliçe Bilgileri
Poliçe No: ABC-00042`);
  assert.equal(fields.customerName, 'Deniz Örnek');
  assert.equal(fields.policyNo, 'ABC-00042');
});

test('missing punctuation and varying spacing do not require an insurer template', () => {
  const fields = parsePolicyPdfFields(`Sigortalı Bilgileri
Adı ve Soyadı Deniz Örnek
T.C.Kimlik No 12345678901
GSM 0532 000 00 00
Poliçe Numarası AB/0001
Başlangıç Tarihi 01.07.2026
Bitiş Tarihi 01.07.2027
Brüt Prim 1.250,00 TL`);
  assert.equal(fields.customerName, 'Deniz Örnek');
  assert.equal(fields.customerTc, '12345678901');
  assert.equal(fields.customerPhone, '0532 000 00 00');
  assert.equal(fields.premium, '1.250,00');
});

test('physical rows override internal PDF draw order and preserve full names', () => {
  const fragment = (str, x, y, width, height = 10) => ({ str, transform: [1, 0, 0, 1, x, y], width, height });
  const text = reconstructPolicyPdfText([
    fragment('Örnek', 174, 80, 30), fragment('Deniz', 140, 80, 30),
    fragment('Ad Soyad / Ünvan', 20, 80, 90),
    fragment('00123', 140, 100, 40), fragment('Poliçe No', 20, 100, 65),
    fragment('Sigortalı Bilgileri', 20, 90, 110),
  ]);
  assert.equal(text, 'Poliçe No\t00123\nSigortalı Bilgileri\nAd Soyad / Ünvan\tDeniz Örnek');
  assert.equal(parsePolicyPdfFields(text).customerName, 'Deniz Örnek');
});

test('body prose is not a customer/company field or product title', () => {
  assert.deepEqual(parsePolicyPdfFields(`Sigortalı veya birlikte yaşadığı aile bireyleri...
sigortalının tüketici sıfatına haiz olması durumunda...
sigorta şirketi teklifi revize edebilir.
Deprem ve DASK kapsamındaki teminatlar dahildir.`), {});
});

test('conflicting dates are flagged instead of silently creating an invalid term', () => {
  const result = extractPolicyPdfFields('Başlangıç Tarihi: 03/06/2027\nBitiş Tarihi: 03/06/2026');
  assert.equal(result.fields.startDate, undefined);
  assert.equal(result.fields.endDate, undefined);
  assert.ok(result.warnings.some(warning => warning.includes('başlangıçtan önce')));
});

test('OCR detects damaged text and scans with a searchable header', () => {
  assert.equal(policyPageNeedsOcr('Poliçe'), true);
  assert.equal(policyPageNeedsOcr('Sigorta poliçesi başlığı '.repeat(4), true), true);
  assert.equal(policyPageNeedsOcr('Bozuk� '.repeat(20)), true);
  assert.equal(policyPageNeedsOcr('Sigortalı bilgileri ve poliçe detayları '.repeat(30), true), false);
});

test('horizontal header table maps values to the correct columns', () => {
  const result = extractPolicyPdfFields(`KARAYOLLARI MOTORLU ARAÇLAR ZORUNLU MALİ SORUMLULUK
SİGORTASI POLİÇESİ
POLİÇE NO\tEK BELGE NO YENİLEME NO\tBRANŞ\tACENTE NO\tTANZİM TARİHİ\tBAŞ. TARİHİ\tBİTİŞ TARİHİ\tSÜRE
000123456\t0\t1\t310\t001234\t01.06.2026\t03.06.2026\t03.06.2027\t365
MODEL YILI\t2018\tSBM POLİÇE NO\t999999999`);
  assert.equal(result.fields.policyNo, '000123456');
  assert.equal(result.fields.startDate, '2026-06-03');
  assert.equal(result.fields.endDate, '2027-06-03');
  assert.equal(result.fields.type, 'Trafik');
});

test('reordered table columns do not require a fixed policy-number index', () => {
  const result = extractPolicyPdfFields(`Müşteri No.\tAcente No\tPoliçe No\tZeyil No\tTanzim Tarihi\tBaşlama Tarihi\tBitiş Tarihi\tGün
12345678\t004321\t301000000000001\t0\t01/06/2026\t03/06/2026\t03/06/2027\t365`);
  assert.deepEqual(result.fields, { policyNo: '301000000000001', startDate: '2026-06-03', endDate: '2027-06-03' });
});

test('incomplete or missing header-table values never become EK or Zeyil', () => {
  for (const row of ['', '1234\t0']) {
    const result = extractPolicyPdfFields(`Poliçe No\tZeyil No\tBaşlama Tarihi\tBitiş Tarihi\n${row}`);
    assert.equal(result.fields.policyNo, undefined);
    assert.equal(result.fields.startDate, undefined);
    assert.ok(result.warnings.some(warning => warning.includes('başlık ve değer')));
  }
  assert.equal(parsePolicyPdfFields('Poliçe No: EK').policyNo, undefined);
  assert.equal(parsePolicyPdfFields('Poliçe No: Zeyil').policyNo, undefined);
});

test('cancellation endorsement preserves main number and original policy term', () => {
  const result = extractPolicyPdfFields(`KARAYOLLARI MOTORLU ARAÇLAR ZORUNLU MALİ SORUMLULUK
ZEYİLNAMESİ
DEVİRDEN DOLAYI FESİH ZEYLİ
POLİÇE/YENİLEME NO\t: 000123456/2\tÜRÜN KODU\t: TR2
ZEYİL NO\t: 1
BAŞLAMA TARİHİ\t: 03/06/2025
BİTİŞ TARİHİ\t: 03/06/2026
ZEYİLNAMENİN
BAŞLAMA TARİHİ\t: 01/06/2026
BİTİŞ TARİHİ\t: 03/06/2026
________ SİGORTALI/SİGORTA ETTİREN BİLGİLERİ ________
ADI SOYADI/ÜNVANI\t: ÖRNEK MÜŞTERİ
TCK/VERGİ DR. NO\t: ****1234567
________ TRAMER BİLGİLERİ ________
Ö. SİGORTA ŞİRKETİ\t: 002 ÖNCEKİ SİGORTACI
ÖNCEKİ POLİÇE NO\t: 99999999
TOPLAM NET PRİM\t:\t-188,94
BRÜT PRİM\t:\t-207.91
ZEYİL KONUSU : SATIŞ NEDENİYLE İPTAL`);
  assert.equal(result.documentKind, 'cancellation');
  assert.equal(result.fields.policyNo, '000123456');
  assert.equal(result.fields.startDate, '2025-06-03');
  assert.equal(result.fields.endDate, '2026-06-03');
  assert.equal(result.fields.company, undefined);
  assert.equal(result.fields.premium, undefined);
  assert.equal(result.fields.netPremium, undefined);
  assert.equal(result.fields.customerName, 'ÖRNEK MÜŞTERİ');
  assert.ok(result.warnings.some(warning => warning.includes('negatif/iade')));
});

test('side-by-side party blocks use the insured and current insurer columns', () => {
  const result = extractPolicyPdfFields(`SÖZLEŞMENİN TARAFLARI
SİGORTA ŞİRKETİ\tACENTE
ÜNVANI\t: ÖRNEK SİGORTA A.Ş.\tÜNVANI\t: ACENTE ARACILIK LTD.
E-POSTA ADRESİ\t: insurer@example.test
SİGORTALI\tSİGORTA ETTİREN
ADI/ÜNVANI\t: DENİZ ÖRNEK\tADI/ÜNVANI\t: BAŞKA KİŞİ
E-POSTA ADRESİ\t: de***@******\tE-POSTA ADRESİ\t: başka@example.test
T.C.KİMLİK NO\t: *******1234\tT.C.KİMLİK NO\t: *******5678
SİGORTA KONUSU ARAÇ VE RİZİKO BİLGİLERİ
PLAKA NO\t: 007 ABC123\tTRAFİK TESCİL TARİHİ\t: 01/06/2025
ÖNCEKİ ŞİRKET ADI\t: ESKİ SİGORTA A.Ş.
ÖNCEKİ POLİÇE NO\t: 99999999`);
  assert.equal(result.fields.company, 'ÖRNEK SİGORTA A.Ş.');
  assert.equal(result.fields.customerName, 'DENİZ ÖRNEK');
  assert.equal(result.fields.customerEmail, undefined);
  assert.equal(result.fields.plate, '007 ABC123');
  assert.equal(result.fields.policyNo, undefined);
});

test('empty image cover can be skipped only when a later policy has complete data', () => {
  assert.equal(isSkippablePolicyCover('', 0, 1, true), true);
  assert.equal(isSkippablePolicyCover('', 0, 1, false), false);
  assert.equal(isSkippablePolicyCover('', 1, 0, true), false);
  assert.equal(isSkippablePolicyCover('', 0, -1, true), false);
  assert.equal(isSkippablePolicyCover('Bozuk metin', 0, 1, true), false);
});

test('a valid insurer email later in the document is not the customer email', () => {
  const result = extractPolicyPdfFields(`Sigortalı Bilgileri
Adı Soyadı: Deniz Örnek
Telefon No/E-Posta: 555*****27
Risk Bilgileri
Plaka: 07 ABC123
E-posta: support@example.test`);
  assert.equal(result.fields.customerEmail, undefined);
  assert.equal(result.fields.customerPhone, undefined);
});

test('Adı Soyadı/Unvanı tolerates wrapped labels and a separate colon row', () => {
  for (const text of [
    'Adı Soyadı/Unvanı: DENİZ ÖRNEK',
    'Adı Soyadı/Unvanı\tDENİZ ÖRNEK',
    'Adı Soyadı/Unvanı\nDENİZ ÖRNEK',
    'Adı Soyadı/\nUnvanı\tDENİZ ÖRNEK',
    'Adı Soyadı/Unvanı\n:\nDENİZ ÖRNEK',
    'Adı Soyadı/\nUnvanı\n:\nDENİZ ÖRNEK',
  ]) assert.equal(parsePolicyPdfFields(text).customerName, 'DENİZ ÖRNEK', text);
});

test('a personal header table preserves spaces within the insured full name', () => {
  const result = extractPolicyPdfFields('Sigortalı Bilgileri\nAdı Soyadı/Unvanı\tT.C. Kimlik No\nDENİZ ÖRNEK\t12345678901');
  assert.equal(result.fields.customerName, 'DENİZ ÖRNEK');
  assert.equal(result.fields.customerTc, '12345678901');
  assert.equal(parsePolicyPdfFields('Adı Soyadı/Unvanı\tT.C. Kimlik No').customerName, undefined);
});

test('personal header columns can change order without using policyholder data', () => {
  const result = extractPolicyPdfFields('Sigortalı Bilgileri\nT.C. Kimlik No\tAdı Soyadı/Unvanı\n12345678901\tDENİZ ÖRNEK\nSigorta Ettiren Bilgileri\nAdı Soyadı/Unvanı\tT.C. Kimlik No\nBAŞKA KİŞİ\t98765432100');
  assert.equal(result.fields.customerName, 'DENİZ ÖRNEK');
  assert.equal(result.fields.customerTc, '12345678901');
});
