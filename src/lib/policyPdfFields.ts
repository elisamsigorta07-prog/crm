export const policyPdfLabels = {
  customerName: 'Sigortalı adı / unvanı', customerTc: 'T.C. / Vergi numarası',
  customerPhone: 'Sigortalı telefonu', customerEmail: 'E-posta',
  policyNo: 'Poliçe numarası', company: 'Sigorta şirketi', type: 'Sigorta türü',
  startDate: 'Başlangıç tarihi', endDate: 'Bitiş tarihi', premium: 'Brüt prim',
  netPremium: 'Net prim', plate: 'Plaka', documentSerial: 'Ruhsat seri numarası',
} as const;
export type PolicyPdfField = keyof typeof policyPdfLabels;
export type PolicyPdfFields = Partial<Record<PolicyPdfField, string>>;
export type PolicyPdfExtraction = {
  fields: PolicyPdfFields;
  sources: Partial<Record<PolicyPdfField, string>>;
  warnings: string[];
  documentKind: 'policy' | 'endorsement' | 'cancellation';
  candidates: Partial<Record<PolicyPdfField, { value: string; source: string }[]>>;
  maskedFields: PolicyPdfField[];
};

const normalize = (value: string) => value.toLocaleLowerCase('tr-TR')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');

// Field meanings, not insurer-specific layouts or fixed coordinates.
const aliases: Record<PolicyPdfField, string> = {
  customerName: 'sigortali(?:nin)? (?:adi?|isim)(?:[ /\\t]+(?:ve[ /\\t]+)?(?:soy[ /\\t]*adi?|soyisim))?(?:[ /\\t]+unvani?)?|sigortali(?:nin)? unvani?|sigortali(?:nin)?|(?:adi?|isim)[ /\\t]+(?:ve[ /\\t]+)?(?:soy[ /\\t]*adi?|soyisim)(?:[ /\\t]+unvani?)?',
  customerTc: '(?:sigortali )?(?:tck[ /]*vergi dr[ .]*no|t[ .]*c[ .]*(?:kimlik)?(?:[ .]*(?:no(?:su)?|numarasi))?|tckn[ /]*vergi no|tckn|vkn|vergi (?:no(?:su)?|numarasi)|kimlik numarasi)',
  customerPhone: 'sigortali(?:nin)? (?:cep )?(?:telefon(?:u)?|gsm)(?: no(?:su)?)?|telefon no[ /]*e[ -]?posta|telefon(?:u)?(?: no(?:su)?| numarasi)?|cep telefonu|cep tel(?:efon)?|gsm',
  customerEmail: '(?:sigortali )?(?:e[ -]?posta(?: adresi)?|e[ -]?mail)',
  policyNo: 'police[ /]+yenileme (?:no(?:su)?[.]?|numarasi)|police (?:no(?:su)?[.]?|numarasi)',
  company: 'sigorta sirketi(?: unvani?)?|sigortaci(?: sirket)?(?: unvani?)?',
  type: 'sigorta (?:turu|bransi)|police turu|urun adi|brans',
  startDate: '(?:police |sigorta |vade )?(?:baslangic|baslama|bas[.])(?: tarihi| tarih)?',
  endDate: '(?:police |sigorta |vade )?bitis(?: tarihi| tarih)?',
  premium: '(?:(?:toplam )?brut prim|(?:toplam )?odenecek (?:toplam )?prim|toplam prim)(?:[ \\t]*\\((?:TL|TRY|₺)\\))?',
  netPremium: '(?:toplam )?net prim(?:[ \\t]*\\((?:TL|TRY|₺)\\))?',
  plate: '(?:arac )?plaka(?:si)?(?: no(?:su)?)?',
  documentSerial: '(?:ruhsat|belge) seri(?: no(?:su)?| numarasi)?',
};
const flexible = (pattern: string) => pattern.replace(/\\.|\[[^\]]*\]| /g, token => token === ' ' ? '[ \\t]+' : token);
const allLabels = Object.values(aliases).map(alias => `(?:${flexible(alias)})`).join('|');
const datePattern = '(?:\\d{4}-\\d{2}-\\d{2}|\\d{1,2}[./-]\\d{1,2}[./-]\\d{4})';
const rangeLabel = '(?:(?:police|sigorta|vade)[ \\t]+)?baslangic[ \\t]*(?:[-/–—]|ve)[ \\t]*bitis[ \\t]+tarih(?:leri|i)?';
const extraLabels = 'ek[ /]*yenileme[ \\t]+no|duzenleme[ \\t]+tarih(?:i)?(?:[ \\t]+ve[ \\t]+saati)?|sure|araci[ \\t]+no|adres(?:i)?|tutar';
const isSectionHeading = (line: string) => /^(?:.*\b(?:bilgileri|teminatlar|aciklamalar)|prim detayi|odeme plani)$/.test(normalize(line.trim()));
const isCorporateTail = (line: string) => /^(?:(?:sanayi|san[.]?|ticaret|tic[.]?|ve|limited|ltd[.]?|sirketi|sti[.]?|anonim|a[.]?s[.]?|ortakligi|holding)[ \t./-]*)+$/.test(normalize(line.trim()));
const hasCorporateEnding = (value: string) => /(?:sirketi|sti[.]|a[.]s[.])$/.test(normalize(value.trim()));

// Recognize the complete header row, including columns we do not import. A
// one-to-one column count is required; never guess a policy number by position.
const tableColumns: { key?: PolicyPdfField; pattern: string }[] = [
  { pattern: 'onceki police no|eski police no|sbm police no|dask police no|ek belge no|zeyil no|yenileme no|acente no|musteri no[.]?|brans|(?:sigorta )?tanzim tarihi|sure|gun' },
  { key: 'policyNo', pattern: aliases.policyNo },
  { key: 'startDate', pattern: aliases.startDate },
  { key: 'endDate', pattern: aliases.endDate },
  { key: 'customerTc', pattern: aliases.customerTc },
  { key: 'customerPhone', pattern: aliases.customerPhone },
  { key: 'customerEmail', pattern: aliases.customerEmail },
  { key: 'customerName', pattern: aliases.customerName },
];
function readHeaderColumns(line: string): (PolicyPdfField | undefined)[] | undefined {
  const pattern = tableColumns.map(column => `(?:${flexible(column.pattern)})`).join('|');
  const expression = new RegExp(`(?:${pattern})(?=[ \\t|:]|$)`, 'g');
  const matches = [...normalize(line).matchAll(expression)];
  if (matches.length < 2 || normalize(line).replace(expression, '').replace(/[\s|:]/g, '')) return;
  const columns = matches.map(match => tableColumns.find(column => new RegExp(`^(?:${flexible(column.pattern)})$`).test(match[0]))?.key);
  const personalTable = columns.includes('customerName') && columns.some(key => key === 'customerTc' || key === 'customerPhone' || key === 'customerEmail');
  return columns.includes('policyNo') || personalTable ? columns : undefined;
}

function preparePolicyLines(text: string): string[] {
  // Normalize only equivalent layout characters before calculating offsets.
  // Remove invisible soft hyphens/zero-width spaces, preserving visible text.
  const lines = text.replace(/[\u200B\uFEFF\u00AD]/g, '').replace(/[\u00A0\u202F]/g, ' ').replace(/：/g, ':').split(/\r?\n/)
    .map(line => line.replace(/^[_\s]+|[_\s]+$/g, '')).filter(line => line && !/^[:=]+$/.test(line));
  const continuedLabel = new RegExp(`^(?:${allLabels}|${rangeLabel})(?=[ \\t:=]|$)`);
  for (let index = 0; index < lines.length - 1; index++) {
    const joined = `${lines[index]} ${lines[index + 1]}`;
    const match = continuedLabel.exec(normalize(joined));
    // Join only when the label itself spans both lines. A value below an
    // already complete label must keep its own row/table relationship.
    if (match && match[0].length > lines[index].length) {
      lines.splice(index, 2, joined);
      index--;
    }
  }
  return lines;
}

function validDate(value: string): string | undefined {
  const match = value.match(/\b(?:(\d{4})-(\d{2})-(\d{2})|(\d{1,2})[./-](\d{1,2})[./-](\d{4}))\b/);
  if (!match) return;
  const year = Number(match[1] || match[6]);
  const month = Number(match[2] || match[5]);
  const day = Number(match[3] || match[4]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function cleanValue(key: PolicyPdfField, raw: string): string | undefined {
  const value = raw.replace(/^[:=\s]+/, '').trim();
  if (!value || /^[*•xX\s.-]+$/.test(value)) return;
  if (new RegExp(`^(?:${allLabels})[ \\t:=]*$`).test(normalize(value))) return;
  if (key === 'startDate' || key === 'endDate') return validDate(value);
  if (key === 'customerTc') {
    const digits = value.replace(/\s/g, '');
    return /^\d{10,11}$/.test(digits) ? digits : undefined;
  }
  if (key === 'customerPhone') {
    if (/[*•xX]/.test(value)) return;
    const digits = value.replace(/\D/g, '');
    return /^(?:90|0)?5\d{9}$/.test(digits) ? value : undefined;
  }
  if (key === 'customerEmail') {
    const email = value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+/);
    return email && !/[*•]/.test(email[0]) ? email[0] : undefined;
  }
  if (key === 'premium' || key === 'netPremium') {
    const amount = value.match(/^(?:TL|TRY|₺)?\s*(\d{1,3}(?: \d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d+)*)\s*(?:TL|TRY|₺)?\s*$/i)?.[1].replace(/ /g, '');
    if (!amount) return;
    if (amount.includes(',') && amount.includes('.')) return /^(?:\d{1,3}(?:\.\d{3})+,\d{1,2}|\d{1,3}(?:,\d{3})+\.\d{1,2})$/.test(amount) ? amount : undefined;
    return /^(?:\d+|\d+[.,]\d{1,2}|\d{1,3}(?:\.\d{3})+)$/.test(amount) ? amount : undefined;
  }
  if (key === 'policyNo') {
    const number = value.match(/^[A-Za-z0-9][A-Za-z0-9./_-]*/)?.[0];
    return number && /\d/.test(number) ? number : undefined;
  }
  if (key === 'plate') {
    const plate = value.toLocaleUpperCase('tr-TR');
    return /^0?(?:0[1-9]|[1-7]\d|8[01])\s*[A-ZÇĞİÖŞÜ]{1,3}\s*\d{2,4}$/.test(plate) ? plate : undefined;
  }
  if (key === 'customerName') {
    if (/[*•]/.test(value)) return;
    if (!/\p{L}/u.test(value) || isSectionHeading(value) || /[:=]/.test(value)) return;
    if (/^(?:bilgileri|adi|soyadi|ad soyad|unvan|kimlik|no|statu|mal sahibi|kiraci)(?:\s|$)/.test(normalize(value)) || /^(?:sigorta ettiren|sigortali|acente)$/.test(normalize(value))) return;
  }
  if (key === 'type' && /^(?:acente|tanzim|police|ek belge|zeyil|yenileme)(?:\s|$)/.test(normalize(value))) return;
  if (key === 'company' && /^(?:acente|sigortali|sigorta ettiren)(?:\s|$)/.test(normalize(value))) return;
  return value;
}

/** Conservative extraction with auditable source rows and human review. */
export function extractPolicyPdfFields(text: string): PolicyPdfExtraction {
  const result: PolicyPdfExtraction = { fields: {}, sources: {}, warnings: [], documentKind: 'policy', candidates: {}, maskedFields: [] };
  const lines = preparePolicyLines(text);
  const candidates = new Map<PolicyPdfField, { value: string; source: string; priority: number }[]>();
  const maskedPriority = new Map<PolicyPdfField, number>();
  const warn = (message: string) => { if (!result.warnings.includes(message)) result.warnings.push(message); };
  if (lines.some(line => /^(?:devirden dolayi fesih zeyli|.*(?:fesih|iptal) zey(?:li|ilnamesi)|zeyil konusu\s*:.*iptal)$/.test(normalize(line)))) {
    result.documentKind = 'cancellation';
    warn('İptal/fesih zeyli algılandı. Bu belgeyle yeni aktif poliçe oluşturmayın; ilgili mevcut poliçenin iptalini ayrıca kontrol edin.');
  } else if (lines.some(line => /^zeyilnamesi$|^zeyil no(?:\s|:)/.test(normalize(line)))) {
    result.documentKind = 'endorsement';
    warn('Zeyil belgesi algılandı. Ana poliçe bilgileri ile zeylin geçerlilik tarihleri farklı olabilir.');
  }
  const add = (key: PolicyPdfField, raw: string, source: string, priority = 1) => {
    if ((key === 'premium' || key === 'netPremium') && /^\s*(?:(?:TL|TRY|₺)\s*)?[-−]/i.test(raw)) {
      warn('Belgede negatif/iade primi var. Normal poliçe prim alanlarına aktarılmadı.');
      return;
    }
    if ((key === 'premium' || key === 'netPremium') && /\b(?:EUR|USD|GBP)\b|[€$£]/i.test(raw)) {
      warn('Prim farklı para biriminde görünüyor. TL alanına otomatik aktarılmadı.');
      return;
    }
    const value = cleanValue(key, raw);
    if (!value) {
      if (['customerName', 'customerTc', 'customerPhone', 'customerEmail'].includes(key) && /[*•]/.test(raw)) {
        warn(`${policyPdfLabels[key]} belgede maskelenmiş. Tam değer otomatik doldurulamaz.`);
        maskedPriority.set(key, Math.max(maskedPriority.get(key) || 0, priority));
      }
      return;
    }
    const list = candidates.get(key) || [];
    list.push({ value, source, priority }); candidates.set(key, list);
  };
  let section: 'insured' | 'policyholder' | 'agent' | 'other' = 'other';
  let partyColumns: ('company' | 'insured' | 'agent' | 'policyholder')[] | undefined;
  let inferredPersonalContext = false;
  let endorsementDates = false;
  let firstNames: { value: string; source: string }[] = [];
  let lastNames: { value: string; source: string }[] = [];
  const flushName = () => {
    const firstValues = new Set(firstNames.map(part => normalize(part.value)));
    const lastValues = new Set(lastNames.map(part => normalize(part.value)));
    if (firstValues.size > 1 || lastValues.size > 1) warn('Ad veya soyad alanında farklı değerler bulundu; isim birleştirilmedi.');
    else if (firstNames[0] && lastNames[0]) add('customerName', `${firstNames[0].value} ${lastNames[0].value}`, `${firstNames[0].source}\n${lastNames[0].source}`, 3);
    firstNames = []; lastNames = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const original = lines[i];
    const line = normalize(original);
    if (/^zeyilnamenin$/.test(line)) { endorsementDates = true; continue; }
    const roleHeaders = line.split(/\t| {2,}|\s*\|\s*/).map(cell => cell.trim()).filter(Boolean);
    if (roleHeaders.length >= 2 && roleHeaders.every(cell => /^(?:sigorta sirketi|acente|sigortali|sigorta ettiren)$/.test(cell))) {
      flushName();
      partyColumns = roleHeaders.map(role => role === 'sigorta sirketi' ? 'company' : role === 'sigortali' ? 'insured' : role === 'sigorta ettiren' ? 'policyholder' : 'agent');
      section = partyColumns.includes('insured') ? 'insured' : 'agent';
      inferredPersonalContext = false;
      continue;
    }
    if (isSectionHeading(original)) {
      flushName();
      partyColumns = undefined; endorsementDates = false; inferredPersonalContext = false;
      section = /sigortali/.test(line) ? 'insured' : /sigorta ettiren/.test(line) ? 'policyholder' : /(?:acente|araci|sirket) bilgileri/.test(line) ? 'agent' : 'other';
      continue;
    }
    if (partyColumns) {
      let partyFieldFound = false;
      for (const key of ['customerName', 'customerTc', 'customerPhone', 'customerEmail'] as const) {
        const pattern = key === 'customerName' ? `(?:adi[ /\\t]*unvani?|unvani?|${aliases.customerName})` : aliases[key];
        const expression = new RegExp(`(?:^|\\t|\\|[ \\t]*| {2,})(?:${flexible(pattern)})(?=[ \\t:=]|$)[ \\t]*[:=]?[ \\t]*`, 'g');
        const matches = [...line.matchAll(expression)];
        if (!matches.length) continue;
        partyFieldFound = true;
        // A repeated field must align with every role. Missing labels/cells are
        // ambiguous in flattened text, so do not assume they belong on the left.
        if (matches.length !== partyColumns.length) continue;
        matches.forEach((match, column) => {
          const role = partyColumns![column];
          const value = original.slice(match.index! + match[0].length, matches[column + 1]?.index ?? original.length).replace(/^[\s|:=]+|[\s|]+$/g, '').replace(/\s+/g, ' ');
          if (role === 'insured') add(key, value, original, 3);
          else if (role === 'company' && key === 'customerName') add('company', value, original, 3);
        });
      }
      if (partyFieldFound) continue;
    }
    const nameHeaders = original.split(/\t| {2,}|\s*\|\s*/).map(cell => normalize(cell.trim()));
    if (section === 'insured' && nameHeaders.length === 2 && nameHeaders.some(label => /^(?:adi?|isim)$/.test(label)) && nameHeaders.some(label => /^(?:soyadi?|soyisim)$/.test(label))) {
      const values = lines[i + 1]?.split(/\t| {2,}|\s*\|\s*/).map(cell => cell.trim()) || [];
      if (values.length === 2) {
        nameHeaders.forEach((label, column) => {
          const value = cleanValue('customerName', values[column]);
          if (value) (/^(?:adi?|isim)$/.test(label) ? firstNames : lastNames).push({ value, source: `${original}\n${lines[i + 1]}` });
        });
        i++;
      }
      continue;
    }
    const columns = readHeaderColumns(original);
    if (columns) {
      let values = lines[i + 1]?.split(/\t+| {2,}|\s*\|\s*/).map(cell => cell.trim()).filter(Boolean) || [];
      if (values.length !== columns.length && !columns.includes('customerName')) values = lines[i + 1]?.split(/\s+/).filter(Boolean) || [];
      if (values.length === columns.length) {
        columns.forEach((key, column) => {
          if (!key || (['customerName', 'customerTc', 'customerPhone', 'customerEmail'].includes(key) && (section === 'agent' || section === 'policyholder'))) return;
          add(key, values[column], `${original}\n${lines[i + 1]}`, 4);
        });
        i++;
      } else warn('Belge tablosunda başlık ve değer sayıları eşleşmedi. İlgili alanları belgeden kontrol edin.');
      continue;
    }
    const belowRange = new RegExp(`^(?:${rangeLabel})[ \\t:=]*$`).test(line) ? lines[i + 1] : undefined;
    const rangeSource = belowRange ? `${original}\n${belowRange}` : original;
    const range = new RegExp(`^(?:${rangeLabel})[ \\t:=]+(${datePattern})[ \\t]*[-/–—][ \\t]*(${datePattern})`, 'i').exec(normalize(rangeSource.replace('\n', ' ')));
    if (!endorsementDates && range) { add('startDate', range[1], rangeSource, 2); add('endDate', range[2], rangeSource, 2); }
    if (section === 'insured' && /^e[ -]?posta[, /]+gsm(?:\s|:|$)/.test(line)) {
      const contacts = original.replace(/^e[ -]?posta[, /]+gsm[\s:]*/i, '');
      const email = contacts.match(/\S+@\S+/)?.[0];
      if (email) add('customerEmail', email, original, 3);
      const phone = contacts.replace(email || '', '').trim();
      if (phone) add('customerPhone', phone, original, 3);
      continue;
    }
    for (const key of Object.keys(aliases) as PolicyPdfField[]) {
      if (endorsementDates && (key === 'startDate' || key === 'endDate')) continue;
      const match = new RegExp(`(?:^|\\t|\\|| {2,})(?:${flexible(aliases[key])})(?=[ \\t:=]|$)[ \\t]*[:=]?[ \\t]*`, 'i').exec(line);
      if (!match) continue;
      const prefix = line.slice(0, match.index).trim();
      if (key === 'company' && /sigorta (?:ettiren|aracisi)|sigortali/.test(prefix)) continue;
      if ((key === 'policyNo' || key === 'endDate' || key === 'startDate') && /(?:dask|sbm|onceki|eski|o[.])\s*$/.test(prefix)) continue;
      const label = match[0].replace(/^[\t| ]+|[\t:= ]+$/g, '');
      // Bare words inside contractual prose are not field labels.
      if (/^(?:sigortali(?:nin)?|sigorta sirketi|sigortaci)$/.test(label) &&
          !/[:=\t]| {2,}/.test(match[0]) && line.slice(match.index + match[0].length)) continue;
      if (/^sigortali(?:nin)?$/.test(match[0].trim()) && /^(?:statu|bilgi|adres|t[ .]*c|telefon)/.test(line.slice(match.index + match[0].length))) continue;
      const personal = ['customerName', 'customerTc', 'customerPhone', 'customerEmail'].includes(key);
      const explicitInsured = normalize(match[0]).includes('sigortali');
      if (personal && !explicitInsured && (section === 'agent' || section === 'policyholder')) continue;
      if (key === 'customerEmail' && !explicitInsured && section !== 'insured' && !inferredPersonalContext) continue;
      let value = original.slice(match.index + match[0].length).trim().split(/\t|\|/)[0].trim();
      let valueSource = original;
      let valueLine = i;
      const next = new RegExp(` {2,}(?:${allLabels}|${extraLabels})(?=[ \\t:=]|$)|[ \\t]+(?:${allLabels}|${extraLabels})[ \\t]*[:=]`, 'i').exec(normalize(value));
      if (next) value = value.slice(0, next.index).trim();
      if (!value && lines[i + 1] && !isSectionHeading(lines[i + 1]) && !new RegExp(`^(?:${allLabels}|${extraLabels})(?=[ \\t:=]|$)`, 'i').test(normalize(lines[i + 1]))) {
        value = lines[i + 1].split(/\t|\|/)[0].trim();
        valueLine = i + 1; valueSource += `\n${lines[i + 1]}`;
      }
      // Corporate suffixes may wrap below an otherwise explicit name value.
      // Do not join arbitrary nearby words, addresses or another table column.
      if ((key === 'customerName' || key === 'company') && value && !partyColumns) {
        for (let continuation = valueLine + 1; continuation <= valueLine + 3 && lines[continuation] && !hasCorporateEnding(value); continuation++) {
          const tail = lines[continuation];
          if (tail.includes('\t') || tail.includes('|') || !isCorporateTail(tail)) break;
          value += ` ${tail}`; valueSource += `\n${tail}`;
        }
      }
      if (key === 'policyNo' && /yenileme/.test(match[0])) value = value.replace(/\/\d+$/, '');
      if (value) add(key, value, valueSource, personal && (section === 'insured' || explicitInsured) ? 3 : 1);
      if (key === 'customerName' && cleanValue(key, value)) {
        if (explicitInsured) section = 'insured';
        else if (section === 'other') inferredPersonalContext = true;
      }
    }
    if (section === 'insured') {
      const parts = [...line.matchAll(/(?:^|\t|\|[ \t]*| {2,})(adi?|isim|soyadi?|soyisim)(?=[ \t:=]|$)[ \t]*[:=]?[ \t]*/g)];
      parts.forEach((part, index) => {
        let raw = original.slice(part.index! + part[0].length, parts[index + 1]?.index ?? original.length).trim();
        if (!raw && lines[i + 1] && !new RegExp(`^(?:${allLabels}|adi?|soyadi?|isim|soyisim)(?=[ \\t:=]|$)`).test(normalize(lines[i + 1]))) raw = lines[i + 1];
        const value = cleanValue('customerName', raw);
        if (value) (/^(?:adi?|isim)$/.test(part[1]) ? firstNames : lastNames).push({ value, source: raw === lines[i + 1] ? `${original}\n${raw}` : original });
      });
    }
    // Only a contract title can identify the product, not a coverage mention.
    if (/sigorta(?:si)?\s+police(?:si)?|^zeyilnamesi$/.test(line) && !candidates.has('type')) {
      const title = normalize(lines.slice(Math.max(0, i - 2), i + 1).join(' '));
      const products: [RegExp, string][] = [
        [/tamamlayici\s+saglik/, 'Tamamlayıcı Sağlık (TSS)'], [/seyahat\s+saglik/, 'Seyahat Sağlık'],
        [/yabanci\s+saglik/, 'Yabancı Sağlık'], [/konut/, 'Konut'], [/kasko/, 'Kasko'],
        [/trafik|karayollari motorlu araclar zorunlu mali sorumluluk/, 'Trafik'], [/isyeri/, 'İşyeri'], [/ozel\s+saglik/, 'Özel Sağlık'], [/dask|zorunlu\s+deprem/, 'DASK'],
      ];
      const product = products.find(([pattern]) => pattern.test(title));
      if (product) add('type', product[1], original);
    }
  }
  flushName();
  for (const [key, list] of candidates) {
    result.candidates[key] = [...new Map(list.map(candidate => [normalize(candidate.value), { value: candidate.value, source: candidate.source }])).values()];
    const priority = Math.max(...list.map(candidate => candidate.priority));
    // A masked insured contact must not fall back to an agency contact elsewhere.
    if ((maskedPriority.get(key) || 0) >= priority) continue;
    const preferred = list.filter(candidate => candidate.priority === priority);
    const values = new Set(preferred.map(candidate => normalize(candidate.value).replace(/\s+/g, ' ').trim()));
    if (values.size !== 1) { warn(`${policyPdfLabels[key]} için birden fazla farklı değer bulundu; otomatik seçim yapılmadı.`); continue; }
    result.fields[key] = preferred[0].value; result.sources[key] = preferred[0].source;
  }
  result.maskedFields = [...maskedPriority.keys()];
  if (result.fields.startDate && result.fields.endDate && result.fields.endDate < result.fields.startDate) {
    delete result.fields.startDate; delete result.fields.endDate; delete result.sources.startDate; delete result.sources.endDate;
    warn('Bitiş tarihi başlangıçtan önce görünüyor; tarihleri belgeden kontrol edin.');
  }
  return result;
}
export function parsePolicyPdfFields(text: string): PolicyPdfFields { return extractPolicyPdfFields(text).fields; }

/** Normalize user-edited review values without reinterpreting neighboring text. */
export function validatePolicyPdfSelection(input: PolicyPdfFields) {
  const fields: PolicyPdfFields = {};
  const issues: Partial<Record<PolicyPdfField, string>> = {};
  for (const key of Object.keys(input) as PolicyPdfField[]) {
    const value = cleanValue(key, input[key] || '');
    if (value) fields[key] = value;
    else issues[key] = `${policyPdfLabels[key]} geçerli bir değer değil; düzeltin veya seçimini kaldırın.`;
  }
  if (fields.startDate && fields.endDate && fields.endDate < fields.startDate) {
    issues.startDate = issues.endDate = 'Başlangıç tarihi bitişten sonra olamaz.';
  }
  if (fields.premium && fields.netPremium) {
    const money = (value: string) => Number(value.includes(',') && value.lastIndexOf(',') > value.lastIndexOf('.') ? value.replace(/\./g, '').replace(',', '.') : /^\d{1,3}(?:\.\d{3})+$/.test(value) ? value.replace(/\./g, '') : value.replace(/,/g, ''));
    if (money(fields.netPremium) > money(fields.premium)) issues.netPremium = 'Net prim brüt primden büyük görünüyor; tutarları kontrol edin.';
  }
  return { fields, issues };
}
