import { extractPolicyPdfFields, policyPdfLabels, validatePolicyPdfSelection, type PolicyPdfExtraction, type PolicyPdfField, type PolicyPdfFields } from './policyPdfFields.ts';

export type PolicyPdfPage = {
  number: number;
  text: string;
  method: 'text' | 'ocr';
  alternativeText?: string;
  ocrConfidence?: number;
  warnings: string[];
};
export type PolicyPdfDocument = { pages: PolicyPdfPage[]; warnings: string[] };
export type PolicyPdfEvidence = { page: number; source: string; method: 'text' | 'ocr' };
export type PolicyPdfReview = PolicyPdfExtraction & {
  evidence: Partial<Record<PolicyPdfField, PolicyPdfEvidence>>;
  choices: Partial<Record<PolicyPdfField, ({ value: string } & PolicyPdfEvidence)[]>>;
  fieldIssues: Partial<Record<PolicyPdfField, string[]>>;
  missingFields: PolicyPdfField[];
  policyNumbers: string[];
  multiplePolicies: boolean;
};
const comparable = (value: string) => value.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
const requiredFields: PolicyPdfField[] = ['customerName', 'policyNo', 'company', 'type', 'startDate', 'endDate', 'premium'];

export function isSkippablePolicyCover(text: string, index: number, firstPolicyIndex: number, coreFieldsComplete: boolean): boolean {
  return coreFieldsComplete && firstPolicyIndex > index && firstPolicyIndex >= 0 && text.trim().length === 0;
}

export function policyPdfFieldScore(fields: PolicyPdfFields): number {
  return Object.keys(fields).reduce((score, key) => score + (key === 'customerName' || key === 'policyNo' ? 4 : requiredFields.includes(key as PolicyPdfField) ? 2 : 1), 0);
}

export function analyzePolicyPdfDocument(document: PolicyPdfDocument, pageNumber?: number): PolicyPdfReview {
  const pages = document.pages.filter(page => pageNumber === undefined || page.number === pageNumber);
  const extraction = extractPolicyPdfFields(pages.map(page => page.text).join('\n\n'));
  const review: PolicyPdfReview = { ...extraction, evidence: {}, choices: {}, fieldIssues: {}, missingFields: [], policyNumbers: [], multiplePolicies: false };
  const primaryPolicyNumbers = new Set<string>();
  const warn = (message: string) => { if (!review.warnings.includes(message)) review.warnings.push(message); };
  for (const warning of document.warnings) warn(warning);
  for (const page of pages) {
    for (const warning of page.warnings) warn(`Sayfa ${page.number}: ${warning}`);
    const variants = [{ text: page.text, method: page.method }, ...(page.alternativeText ? [{ text: page.alternativeText, method: page.method === 'ocr' ? 'text' as const : 'ocr' as const }] : [])];
    const analyses = variants.map(variant => ({ ...variant, result: extractPolicyPdfFields(variant.text) }));
    for (const candidate of analyses[0].result.candidates.policyNo || []) primaryPolicyNumbers.add(candidate.value);
    for (const { result, method } of analyses) {
      for (const key of Object.keys(result.candidates) as PolicyPdfField[]) {
        const choices = review.choices[key] || [];
        for (const candidate of result.candidates[key] || []) {
          if (!choices.some(choice => comparable(choice.value) === comparable(candidate.value) && choice.page === page.number && choice.method === method)) choices.push({ ...candidate, page: page.number, method });
          if (review.fields[key] && comparable(review.fields[key]!) === comparable(candidate.value) && (!review.evidence[key] || review.sources[key] === candidate.source)) {
            review.evidence[key] = { page: page.number, source: candidate.source, method };
          }
        }
        review.choices[key] = choices;
      }
    }
    // A better-looking OCR result must not silently overwrite a different
    // searchable value. Expose both readings and let the user choose.
    if (analyses.length === 2) for (const key of Object.keys(policyPdfLabels) as PolicyPdfField[]) {
      const [first, second] = analyses.map(analysis => analysis.result.fields[key]);
      if (first && second && comparable(first) !== comparable(second)) {
        delete review.fields[key]; delete review.evidence[key];
        review.fieldIssues[key] = ['Metin katmanı ile görsel okuma farklı değerler verdi; belgeden kontrol ederek seçin.'];
        warn(`${policyPdfLabels[key]} için iki okuma yöntemi uyuşmuyor.`);
      }
    }
  }
  review.policyNumbers = [...primaryPolicyNumbers];
  review.multiplePolicies = review.policyNumbers.length > 1;
  if (review.multiplePolicies) warn('Belgede birden fazla poliçe numarası var. Farklı poliçelerin bilgilerini karıştırmamak için incelenecek sayfayı seçin.');
  for (const key of Object.keys(review.fields) as PolicyPdfField[]) {
    const evidence = review.evidence[key];
    const page = pages.find(page => page.number === evidence?.page);
    if (evidence?.method === 'ocr' && page?.ocrConfidence !== undefined && page.ocrConfidence < 75) review.fieldIssues[key] = ['Bu sayfanın görsel okuma kalitesi düşük; değeri PDF ile karşılaştırıp seçin.'];
    if (key === 'customerName' && !/\s/.test(review.fields[key]!)) review.fieldIssues[key] = ['Ad/unvan tek sözcük olarak okundu; tamamının alındığını kontrol edin.'];
  }
  const validated = validatePolicyPdfSelection(review.fields);
  for (const key of Object.keys(validated.issues) as PolicyPdfField[]) review.fieldIssues[key] = [validated.issues[key]!];
  review.missingFields = requiredFields.filter(key => !review.fields[key]);
  return review;
}

/** At most three relevant native pages get an extra OCR pass for missing core
 * fields. Full legal/coverage text is not re-OCR'd just because it lacks names.
 */
export function planPolicyPdfOcr(pages: string[], alreadyNeeded: boolean[], forceOcr = false): number[] {
  if (forceOcr) return pages.map((_, index) => index);
  const combined = extractPolicyPdfFields(pages.join('\n\n'));
  const coreComplete = ['customerName', 'policyNo', 'startDate', 'endDate', 'premium'].every(key => combined.fields[key as PolicyPdfField]);
  const pageFields = pages.map(text => extractPolicyPdfFields(text).fields);
  const firstDetail = pageFields.findIndex(fields => fields.customerName && fields.policyNo);
  const selected = new Set(alreadyNeeded.flatMap((needed, index) => needed && !isSkippablePolicyCover(pages[index], index, firstDetail, coreComplete) ? [index] : []));
  if (!coreComplete && combined.documentKind === 'policy') {
    const ranked = pages.map((text, index) => ({ index, score: policyPdfFieldScore(pageFields[index]), labels: /(?:ad[ıi]?\s*soy|sigortal[ıi]|pol[iİı]çe|police)/i.test(text) && /[:\t]/.test(text) }))
      .filter(page => page.labels && !selected.has(page.index)).sort((a, b) => b.score - a.score || a.index - b.index).slice(0, 3);
    ranked.forEach(page => selected.add(page.index));
  }
  return [...selected].sort((a, b) => a - b);
}
