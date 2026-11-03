import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { extractPolicyPdfFields } from '../src/lib/policyPdfFields.ts';
import { reconstructPolicyPdfText } from '../src/lib/policyPdfReader.ts';

// Expected values are independent synthetic data. Variations cover document
// layouts and ambiguous neighbors, not just examples of the implementation.
let distinctCasesChecked = 0;
after(() => console.log(`Benzersiz metin/eşleştirme kontrolü: ${distinctCasesChecked}; ayrıca 200 karıştırılmış geometrik girdi üretildi.`));
function checkCases(cases) {
  cases = [...new Map(cases.map(entry => [JSON.stringify([entry.text, entry.expected]), entry])).values()];
  distinctCasesChecked += cases.length;
  const failures = [];
  for (const { label, text, expected } of cases) {
    const actual = extractPolicyPdfFields(text).fields;
    const mismatches = Object.entries(expected).filter(([key, value]) => actual[key] !== value);
    if (mismatches.length) failures.push({ label, mismatches: mismatches.map(([key, value]) => ({ key, expected: value ?? null, actual: actual[key] ?? null })), text });
  }
  assert.equal(failures.length, 0, `${failures.length}/${cases.length} combinations failed. First failures:\n${JSON.stringify(failures.slice(0, 7), null, 2)}`);
}

const separators = [': ', ' : ', '= ', '\t: ', '\t', '  ', ' ', '\n', '\n:\n', '： '];
const nameLabels = ['Adı Soyadı/Unvanı', 'ADI SOYADI/ÜNVANI', 'Ad Soyad / Ünvan', 'Adı ve Soyadı', 'Sigortalı Adı Soyadı', 'Sigortalının Adı Soyadı', 'Ad/Soyad', 'Adı / Soyadı', 'İsim Soyisim', 'Sigortalı Adı Soyadı / Unvanı'];
const names = ['DENİZ ÖRNEK', 'ŞULE IŞIK', 'ÖRNEK GIDA SAN. VE TİC. LTD. ŞTİ.'];

test('900 name-label, delimiter, value and section combinations', () => {
  const cases = [];
  for (const label of nameLabels) for (const separator of separators) for (const name of names) {
    for (const context of ['', 'Sigortalı Bilgileri\n', 'Acente Bilgileri\nAd Soyad: Başka Yetkili\nSigortalı Bilgileri\n']) {
      cases.push({ label: `${label} / ${JSON.stringify(separator)}`, text: `${context}${label}${separator}${name}`, expected: { customerName: name } });
    }
  }
  assert.equal(cases.length, 900);
  checkCases(cases);
});

test('48 monetary-format and label-delimiter combinations', () => {
  const cases = [];
  const formats = [
    ['12.345,67', '12.345,67'], ['12,345.67', '12,345.67'], ['12345,67', '12345,67'], ['12345.67', '12345.67'],
    ['12 345,67', '12345,67'], ['12\u00a0345,67', '12345,67'], ['12\u202f345.67', '12345.67'], ['₺ 12.345,67', '12.345,67'],
  ];
  for (const [amount, expected] of formats) for (const label of ['Brüt Prim', 'Brüt Prim (TL)']) for (const separator of [': ', '\t:\t', '\n']) {
    cases.push({ label: `${label} / ${amount} / ${separator}`, text: `${label}${separator}${amount} TL`, expected: { premium: expected } });
  }
  checkCases(cases);
});

test('24 split-name and name-part order combinations', () => {
  const cases = [];
  for (const reverse of [false, true]) for (const style of ['inline', 'below', 'header', 'separate']) for (const first of ['DENİZ', 'ŞULE', 'ALİ DENİZ']) {
    const entries = reverse ? [['Soyadı', 'ÖRNEK'], ['Adı', first]] : [['Adı', first], ['Soyadı', 'ÖRNEK']];
    const body = style === 'header' ? `${entries.map(entry => entry[0]).join('\t')}\n${entries.map(entry => entry[1]).join('\t')}`
      : entries.map(([label, value]) => `${label}${style === 'below' ? '\n' : ': '}${value}`).join(style === 'inline' ? '\t' : '\n');
    cases.push({ label: `${reverse} / ${style} / ${first}`, text: `Sigortalı Bilgileri\n${body}`, expected: { customerName: `${first} ÖRNEK` } });
  }
  checkCases(cases);
});

test('72 personal-table column permutations retain multiword names', () => {
  const columns = [['Adı Soyadı/Unvanı', 'ALİ DENİZ ÖRNEK'], ['T.C. Kimlik No', '12345678901'], ['GSM', '05320000000'], ['E-posta', 'deniz@example.test']];
  const cases = [];
  for (const fields of permutations(columns)) for (const separator of ['\t', '  ', ' | ']) cases.push({
    label: fields.map(field => field[0]).join('/') + separator,
    text: `Sigortalı Bilgileri\n${fields.map(field => field[0]).join(separator)}\n${fields.map(field => field[1]).join(separator)}`,
    expected: { customerName: 'ALİ DENİZ ÖRNEK', customerTc: '12345678901', customerPhone: '05320000000', customerEmail: 'deniz@example.test' },
  });
  checkCases(cases);
});

test('12 masked-name, conflicting-name-part and invalid-money combinations abstain', () => {
  const cases = [];
  for (const separator of [': ', '\t', '\n']) {
    cases.push({ label: 'masked name', text: `Adı Soyadı/Unvanı${separator}D**** Ö****`, expected: { customerName: undefined } });
    cases.push({ label: 'conflicting first names', text: `Sigortalı Bilgileri\nAdı${separator}DENİZ\nAdı${separator}ŞULE\nSoyadı${separator}ÖRNEK`, expected: { customerName: undefined } });
    cases.push({ label: 'negative currency', text: `Brüt Prim${separator}₺ -12.345,67`, expected: { premium: undefined } });
    cases.push({ label: 'foreign currency', text: `Brüt Prim${separator}12.345,67 EUR`, expected: { premium: undefined } });
  }
  checkCases(cases);
});

const fieldDefinitions = [
  ['policyNo', ['Poliçe No', 'POLİÇE NUMARASI', 'Poliçe No.', 'Poliçe Numarası'], 'AB-0000123/1'],
  ['customerTc', ['T.C.Kimlik No', 'TC Kimlik No', 'Kimlik Numarası', 'TCKN'], '12345678901'],
  ['customerPhone', ['GSM', 'Cep Telefonu', 'Telefon No', 'Sigortalı Telefonu'], '0532 000 00 00'],
  ['customerEmail', ['E-posta', 'E-Posta Adresi', 'E-mail', 'Sigortalı E-posta'], 'deniz@example.test'],
  ['startDate', ['Başlangıç Tarihi', 'Başlama Tarihi', 'Poliçe Başlangıç Tarihi', 'Baş. Tarihi'], '03.06.2026', '2026-06-03'],
  ['endDate', ['Bitiş Tarihi', 'Poliçe Bitiş Tarihi', 'Vade Bitiş Tarihi', 'Sigorta Bitiş Tarihi'], '03/06/2027', '2027-06-03'],
  ['premium', ['Brüt Prim', 'Toplam Ödenecek Prim', 'Ödenecek Toplam Prim', 'Toplam Brüt Prim'], '12.345,67'],
  ['netPremium', ['Net Prim', 'Toplam Net Prim'], '10,000.00'],
  ['plate', ['Plaka', 'Plaka No', 'Araç Plakası', 'PLAKA NO'], '07 ABC123'],
];

test('340 independent field-label and delimiter combinations', () => {
  const cases = [];
  for (const [key, labels, value, normalized = value] of fieldDefinitions) for (const label of labels) for (const separator of separators) {
    cases.push({ label: `${key} / ${label} / ${JSON.stringify(separator)}`, text: `Sigortalı Bilgileri\n${label}${separator}${value}`, expected: { [key]: normalized } });
  }
  assert.equal(cases.length, 340);
  checkCases(cases);
});

function permutations(values) {
  if (values.length < 2) return [values];
  return values.flatMap((value, index) => permutations(values.filter((_, i) => i !== index)).map(rest => [value, ...rest]));
}

test('720 policy-header column permutations preserve IDs and dates', () => {
  const columns = [
    ['Müşteri No', '001122'], ['Poliçe No', '000987654'], ['Yenileme No', '2'],
    ['Tanzim Tarihi', '01/06/2026'], ['Başlama Tarihi', '03/06/2026'], ['Bitiş Tarihi', '03/06/2027'],
  ];
  checkCases(permutations(columns).map((columns, index) => ({
    label: `order ${index}`, text: `${columns.map(column => column[0]).join('\t')}\n${columns.map(column => column[1]).join('\t')}`,
    expected: { policyNo: '000987654', startDate: '2026-06-03', endDate: '2027-06-03' },
  })));
});

test('24 party-column and repeated-field combinations select the correct person/company', () => {
  const cases = [];
  for (const delimiter of ['\t', '  ', ' | ']) {
    for (const reverse of [false, true]) for (const masked of [false, true]) {
      const roles = reverse ? ['Sigorta Ettiren', 'Sigortalı'] : ['Sigortalı', 'Sigorta Ettiren'];
      const values = reverse ? ['Başka Kişi', 'DENİZ ÖRNEK'] : ['DENİZ ÖRNEK', 'Başka Kişi'];
      const identities = reverse ? ['98765432100', masked ? '*******1234' : '12345678901'] : [masked ? '*******1234' : '12345678901', '98765432100'];
      cases.push({ label: `person ${delimiter} / ${reverse} / ${masked}`, text: `${roles.join(delimiter)}\n${values.map(value => `Adı/Unvanı: ${value}`).join(delimiter)}\n${identities.map(value => `T.C.Kimlik No: ${value}`).join(delimiter)}`, expected: { customerName: 'DENİZ ÖRNEK', customerTc: masked ? undefined : '12345678901' } });
      const insurer = masked ? 'FARKLI SİGORTA A.Ş.' : 'ÖRNEK SİGORTA A.Ş.';
      const companies = reverse ? ['ACENTE LTD.', insurer] : [insurer, 'ACENTE LTD.'];
      cases.push({ label: `company ${delimiter} / ${reverse}`, text: `${(reverse ? ['Acente', 'Sigorta Şirketi'] : ['Sigorta Şirketi', 'Acente']).join(delimiter)}\n${companies.map(value => `Unvanı: ${value}`).join(delimiter)}`, expected: { company: insurer } });
    }
  }
  assert.equal(cases.length, 24);
  checkCases(cases);
});

test('48 Unicode-whitespace and wrapped-label combinations', () => {
  const cases = [];
  const labels = ['Adı Soyadı/Unvanı', 'Ad Soyad / Ünvan', 'Poliçe Numarası', 'Başlangıç Tarihi'];
  for (const label of labels) for (const whitespace of [' ', '\u00a0', '\u202f', '\t']) for (const wrap of [false, true, 'colon']) {
    const changed = wrap ? label.replace(' ', '\n') : label.replaceAll(' ', whitespace);
    const key = label.startsWith('Poliçe') ? 'policyNo' : label.startsWith('Başlangıç') ? 'startDate' : 'customerName';
    const value = key === 'policyNo' ? '00012345' : key === 'startDate' ? '03.06.2026' : 'DENİZ ÖRNEK';
    cases.push({ label: `${label} / whitespace ${JSON.stringify(whitespace)} / ${wrap}`, text: changed + (wrap === 'colon' ? '\n:\n' : ': ') + value, expected: { [key]: key === 'startDate' ? '2026-06-03' : value } });
  }
  checkCases(cases);
});

test('16 combined-date layout combinations', () => {
  const cases = [];
  for (const label of ['Başlangıç-Bitiş Tarihi', 'Başlangıç / Bitiş Tarihleri', 'Başlangıç ve Bitiş Tarihi', 'Poliçe Başlangıç-Bitiş Tarihi']) {
    for (const separator of [': ', '\t', '\n', '\n:\n']) cases.push({ label: label + JSON.stringify(separator), text: `${label}${separator}03/06/2026 – 03/06/2027`, expected: { startDate: '2026-06-03', endDate: '2027-06-03' } });
  }
  checkCases(cases);
});

test('200 shuffled geometric text layouts preserve full names and identifiers', () => {
  const cases = [];
  for (let seed = 0; seed < 200; seed++) {
    let state = seed + 1;
    const random = () => { state = Math.imul(state, 1664525) + 1013904223 | 0; return (state >>> 0) / 4294967296; };
    const font = 8 + seed % 7;
    const fragments = [];
    const add = (text, x, y) => {
      for (const word of text.split(' ')) {
        const width = word.length * font * 0.5;
        fragments.push({ str: word, transform: [1, 0, 0, 1, x, y + random() - 0.5], width, height: font });
        x += width + font * 0.3;
      }
    };
    add('Sigortalı Bilgileri', 20, 700);
    add('Adı Soyadı/Unvanı', 20, 670); add('DENİZ ÖRNEK', 220, 670);
    add('Poliçe No', 20, 640); add('00012345', 220, 640);
    for (let i = fragments.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [fragments[i], fragments[j]] = [fragments[j], fragments[i]]; }
    cases.push({ label: `geometry seed ${seed}`, text: reconstructPolicyPdfText(fragments), expected: { customerName: 'DENİZ ÖRNEK', policyNo: '00012345' } });
  }
  checkCases(cases);
});

test('24 ambiguous, masked and unrelated rows abstain instead of inventing values', () => {
  const cases = [];
  for (const delimiter of [': ', '\t', '\n']) {
    for (const label of ['Adı Soyadı/Unvanı', 'Sigortalı Adı Soyadı']) {
      cases.push({ label: 'conflict ' + label, text: `${label}${delimiter}DENİZ ÖRNEK\n${label}${delimiter}ŞULE IŞIK`, expected: { customerName: undefined } });
      cases.push({ label: 'missing ' + label, text: `${label}\nT.C. Kimlik No${delimiter}12345678901`, expected: { customerName: undefined } });
      cases.push({ label: 'masked ' + label, text: `Sigortalı Bilgileri\n${label}${delimiter}DENİZ ÖRNEK\nTCKN${delimiter}*******1234\nGSM${delimiter}*******7771`, expected: { customerTc: undefined, customerPhone: undefined } });
      const agentLabel = label.startsWith('Sigortalı') ? 'Ad Soyad / Ünvan' : label;
      cases.push({ label: 'agent ' + agentLabel, text: `Acente Bilgileri\n${agentLabel}${delimiter}ACENTE YETKİLİSİ`, expected: { customerName: undefined } });
    }
  }
  checkCases(cases);
});
