import { parsePolicyPdfFields } from './policyPdfFields.ts';
import { planPolicyPdfOcr, policyPdfFieldScore, type PolicyPdfDocument, type PolicyPdfPage } from './policyPdfDocument.ts';
import { validatePolicyPdf } from './policyPdfValidation.ts';

export { MAX_POLICY_PDF_BYTES, validatePolicyPdf } from './policyPdfValidation.ts';
export { isSkippablePolicyCover } from './policyPdfDocument.ts';

type PdfTextFragment = { str: string; transform: number[]; width: number; height: number };

/** Restore physical reading order, regardless of the PDF's internal draw order.
 * Small word gaps stay within a cell; column gaps become tabs. No insurer,
 * page number, fixed coordinates or customer-specific template is involved.
 */
export function reconstructPolicyPdfText(items: PdfTextFragment[]): string {
  const fragments = items.filter(item => item.str.trim() && item.transform.every(Number.isFinite));
  const rows: { y: number; height: number; items: PdfTextFragment[] }[] = [];
  for (const item of [...fragments].sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4])) {
    const y = item.transform[5];
    const height = Math.abs(item.height) || 10;
    const row = rows.find(row => Math.abs(row.y - y) <= Math.max(2, Math.min(height, row.height) * 0.35));
    if (row) row.items.push(item);
    else rows.push({ y, height, items: [item] });
  }
  return rows.map(row => {
    const ordered = row.items.sort((a, b) => a.transform[4] - b.transform[4]);
    let previous: PdfTextFragment | undefined;
    let line = '';
    for (const item of ordered) {
      const gap = previous ? item.transform[4] - previous.transform[4] - previous.width : 0;
      const fontSize = Math.min(Math.abs(previous?.height || item.height), Math.abs(item.height)) || 10;
      const separator = !previous ? '' : gap > Math.max(10, fontSize * 1.4) ? '\t' : gap > fontSize * 0.12 ? ' ' : '';
      line += separator + item.str;
      previous = item;
    }
    return line.trim();
  }).filter(Boolean).join('\n');
}

export function policyPageNeedsOcr(text: string, hasImage = false): boolean {
  const compact = text.replace(/\s/g, '');
  if (compact.length < 40) return true;
  const damaged = (compact.match(/[\uFFFD\u0000-\u0008\uE000-\uF8FF]/g) || []).length;
  if (damaged / compact.length > 0.015) return true;
  // A scanned body can coexist with a searchable header or footer.
  return hasImage && compact.length < 400 && text.split('\n').filter(line => line.trim()).length < 8;
}

type OcrResult = { text: string; confidence: number; blocks: { paragraphs: { lines: { bbox: { y1: number; y0: number }; words: { text: string; bbox: { x0: number; x1: number } }[] }[] }[] }[] | null };

export function policyPdfOcrText(result: OcrResult): string {
  const fragments: PdfTextFragment[] = [];
  for (const block of result.blocks || []) for (const paragraph of block.paragraphs) for (const line of paragraph.lines) {
    for (const word of line.words) fragments.push({ str: word.text, width: word.bbox.x1 - word.bbox.x0, height: line.bbox.y1 - line.bbox.y0, transform: [1, 0, 0, 1, word.bbox.x0, -line.bbox.y1] });
  }
  const structured = reconstructPolicyPdfText(fragments);
  return structured && policyPdfFieldScore(parsePolicyPdfFields(structured)) >= policyPdfFieldScore(parsePolicyPdfFields(result.text)) ? structured : result.text;
}

export function choosePolicyPdfReading(nativeText: string, ocrText: string, forceOcr = false): Pick<PolicyPdfPage, 'text' | 'alternativeText' | 'method'> {
  if (!nativeText.trim()) return { text: ocrText, method: 'ocr' };
  if (!ocrText.trim()) return { text: nativeText, method: 'text' };
  const preferOcr = forceOcr || policyPdfFieldScore(parsePolicyPdfFields(ocrText)) > policyPdfFieldScore(parsePolicyPdfFields(nativeText));
  return { text: preferOcr ? ocrText : nativeText, alternativeText: nativeText === ocrText ? undefined : preferOcr ? nativeText : ocrText, method: preferOcr ? 'ocr' : 'text' };
}

function withAbort<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException('PDF okuma iptal edildi.', 'AbortError'));
    if (signal.aborted) { void promise.catch(() => {}); abort(); return; }
    signal.addEventListener('abort', abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}

export async function readPolicyPdfDocument(file: File, onProgress: (text: string) => void, options: { forceOcr?: boolean; signal?: AbortSignal } = {}): Promise<PolicyPdfDocument> {
  if (options.signal?.aborted) throw new DOMException('PDF okuma iptal edildi.', 'AbortError');
  await validatePolicyPdf(file);
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/vendor/pdf.worker.min.mjs';
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), cMapUrl: '/vendor/pdf-cmaps/', cMapPacked: true, standardFontDataUrl: '/vendor/pdf-fonts/', wasmUrl: '/vendor/pdf-wasm/' });
  let worker: Awaited<ReturnType<typeof import('tesseract.js').createWorker>> | undefined;
  try {
    const pdf = await withAbort(task.promise, options.signal);
    if (pdf.numPages > 30) throw new Error('Bilgi çıkarmak için en fazla 30 sayfalık PDF yükleyin. Dosyayı ek olarak yine saklayabilirsiniz.');
    const pages: PolicyPdfPage[] = [];
    const needsOcr: boolean[] = [];
    // Inspect all searchable pages before requiring OCR. A scanned advertising
    // cover must not prevent reading a complete policy on the following page.
    for (let n = 1; n <= pdf.numPages; n++) {
      onProgress(`Sayfa ${n}/${pdf.numPages} okunuyor…`);
      const page = await withAbort(pdf.getPage(n), options.signal);
      let text = '';
      const warnings: string[] = [];
      try {
        const content = await withAbort(page.getTextContent(), options.signal);
        text = reconstructPolicyPdfText(content.items.filter((item): item is Extract<typeof item, { str: string }> => 'str' in item));
      } catch (error) {
        if (options.signal?.aborted) throw error;
        warnings.push('Metin katmanı okunamadı; görselden okuma denenecek.');
      }
      let hasImage = false;
      if (text.replace(/\s/g, '').length < 400 && !options.forceOcr) {
        const operators = await page.getOperatorList();
        hasImage = operators.fnArray.some(operator => operator === pdfjs.OPS.paintImageXObject || operator === pdfjs.OPS.paintInlineImageXObject);
      }
      pages.push({ number: n, text, method: 'text', warnings });
      needsOcr.push(policyPageNeedsOcr(text, hasImage));
      page.cleanup();
    }
    for (const index of planPolicyPdfOcr(pages.map(page => page.text), needsOcr, options.forceOcr)) {
      const n = index + 1;
      const page = await withAbort(pdf.getPage(n), options.signal);
      let canvas: HTMLCanvasElement | undefined;
      try {
        onProgress(`Sayfa ${n}/${pdf.numPages}: görselden okuma ile bilgiler kontrol ediliyor…`);
        if (!worker) {
          const { createWorker } = await import('tesseract.js');
          // Save the worker even if cancellation happens during initialization,
          // so the finally block can terminate it as soon as it becomes ready.
          const initializing = createWorker('tur+eng', 1, { workerPath: '/vendor/tesseract/worker.min.js', corePath: '/vendor/tesseract/core', langPath: '/vendor/tesseract/lang' });
          initializing.then(ready => { if (options.signal?.aborted) void ready.terminate(); }, () => {});
          worker = await withAbort(initializing, options.signal);
        }
        await withAbort(worker.setParameters({ preserve_interword_spaces: '1', user_defined_dpi: '220', tessedit_pageseg_mode: '3' as import('tesseract.js').PSM }), options.signal);
        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(3, 2800 / Math.max(viewport.width, viewport.height));
        const rendered = page.getViewport({ scale });
        canvas = document.createElement('canvas');
        canvas.width = Math.ceil(rendered.width);
        canvas.height = Math.ceil(rendered.height);
        await withAbort(page.render({ canvas, viewport: rendered }).promise, options.signal);
        let result = await withAbort(worker.recognize(canvas, { rotateAuto: true }, { blocks: true, text: true }), options.signal);
        let ocrText = policyPdfOcrText(result.data);
        const extracted = parsePolicyPdfFields(ocrText);
        if ((!extracted.customerName || !extracted.policyNo) && /(?:sigortal[ıi]|pol[iİı]çe|police)/i.test(ocrText) && /[:\t]/.test(ocrText)) {
          onProgress(`Sayfa ${n}/${pdf.numPages}: farklı yerleşimle ikinci okuma deneniyor…`);
          await withAbort(worker.setParameters({ tessedit_pageseg_mode: '11' as import('tesseract.js').PSM }), options.signal);
          const retry = await withAbort(worker.recognize(canvas, { rotateAuto: true }, { blocks: true, text: true }), options.signal);
          const retryText = policyPdfOcrText(retry.data);
          if (policyPdfFieldScore(parsePolicyPdfFields(retryText)) > policyPdfFieldScore(extracted)) { result = retry; ocrText = retryText; }
        }
        pages[index] = { ...pages[index], ...choosePolicyPdfReading(pages[index].text, ocrText, options.forceOcr), ocrConfidence: result.data.confidence };
      } catch (error) {
        if (options.signal?.aborted) throw error;
        pages[index].warnings.push('Görselden okuma tamamlanamadı. Mevcut metin korundu; eksik alanlar için tekrar deneyin.');
      } finally {
        if (canvas) canvas.width = canvas.height = 0;
        page.cleanup();
      }
    }
    const text = pages.map(page => page.text).join('\n\n');
    if (!text.trim()) throw new Error('PDF içinde okunabilir yazı bulunamadı. Daha net bir belge deneyin.');
    return { pages, warnings: [] };
  } catch (error) {
    if (error instanceof Error && error.name === 'PasswordException') throw new Error('Şifreli PDF okunamıyor. Şifresiz bir kopyasını yükleyin.');
    throw error;
  } finally {
    await Promise.allSettled([worker?.terminate(), task.destroy()]);
  }
}

export async function readPolicyPdf(file: File, onProgress: (text: string) => void, options: { forceOcr?: boolean; signal?: AbortSignal } = {}) {
  const document = await readPolicyPdfDocument(file, onProgress, options);
  return document.pages.map(page => page.text).join('\n\n');
}
