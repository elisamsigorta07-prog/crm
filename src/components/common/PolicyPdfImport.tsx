'use client';

import { useEffect, useRef, useState } from 'react';
import { policyPdfLabels, validatePolicyPdfSelection, type PolicyPdfField, type PolicyPdfFields } from '@/lib/policyPdfFields';
import { analyzePolicyPdfDocument, type PolicyPdfDocument, type PolicyPdfEvidence, type PolicyPdfReview } from '@/lib/policyPdfDocument';
import { readPolicyPdfDocument } from '@/lib/policyPdfReader';

const keys = Object.keys(policyPdfLabels) as PolicyPdfField[];
const panel = { padding: 16, background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 12, marginBottom: 20 };
const fieldset = { border: 0, padding: 0, margin: 0, minWidth: 0 };

export default function PolicyPdfImport({ onApply, onBusyChange }: {
  onApply: (fields: PolicyPdfFields, file: File) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fields, setFields] = useState<PolicyPdfFields>({});
  const [selected, setSelected] = useState<PolicyPdfField[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [document, setDocument] = useState<PolicyPdfDocument | null>(null);
  const [review, setReview] = useState<PolicyPdfReview | null>(null);
  const [scope, setScope] = useState<number | undefined>();
  const [pickedEvidence, setPickedEvidence] = useState<Partial<Record<PolicyPdfField, PolicyPdfEvidence>>>({});
  const [forceOcr, setForceOcr] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const controller = useRef<AbortController | null>(null);
  const running = useRef(false);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function showReview(document: PolicyPdfDocument, page?: number) {
    const result = analyzePolicyPdfDocument(document, page);
    setReview(result); setScope(page); setFields({ ...result.fields }); setPickedEvidence({});
    setSelected(result.multiplePolicies ? [] : keys.filter(key => result.fields[key] && !result.fieldIssues[key]?.length));
  }
  async function read(target?: File, retryOcr = forceOcr) {
    if (!target || running.current) return;
    running.current = true; setBusy(true); onBusyChange(true); setError('');
    controller.current = new AbortController();
    try {
      const result = await readPolicyPdfDocument(target, setMessage, { forceOcr: retryOcr, signal: controller.current.signal });
      setDocument(result); setFile(target); showReview(result);
      setPreviewUrl(URL.createObjectURL(target));
      setMessage('Okuma tamamlandı. Bulunan alanları kaynak sayfalarıyla kontrol edin; eksik alanları elle tamamlayabilirsiniz.');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') setMessage('Okuma iptal edildi. Önceki sonuçlar korundu.');
      else { setError(error instanceof Error ? error.message : 'PDF okunamadı.'); setMessage(''); }
    } finally {
      controller.current = null; running.current = false; setBusy(false); onBusyChange(false);
    }
  }
  function editField(key: PolicyPdfField, value: string, evidence?: PolicyPdfEvidence) {
    setFields(previous => ({ ...previous, [key]: value }));
    setSelected(previous => value.trim() ? previous.includes(key) ? previous : [...previous, key] : previous.filter(field => field !== key));
    if (evidence) setPickedEvidence(previous => ({ ...previous, [key]: evidence }));
  }
  const selection = Object.fromEntries(selected.map(key => [key, fields[key] || ''])) as PolicyPdfFields;
  const validated = validatePolicyPdfSelection(selection);
  const selectedInvalid = Object.keys(validated.issues).length > 0;
  const blocked = review?.documentKind === 'cancellation' || !!review?.multiplePolicies;
  const source = document?.pages.filter(page => scope === undefined || page.number === scope).map(page => `SAYFA ${page.number}\n${page.text}`).join('\n\n') || '';

  return <section style={panel}>
    <h3 style={{ marginTop: 0 }}>PDF’den poliçe bilgilerini al</h3>
    <p>Bilgiler tarayıcınızda okunur. En fazla 20 MB / 30 sayfa. Eksik bilgiler için ilgili sayfalarda görselden okuma otomatik denenir.</p>
    <fieldset disabled={busy} style={fieldset}>
      <label style={{ display: 'block', marginBottom: 12 }}><input type="checkbox" checked={forceOcr} onChange={event => setForceOcr(event.target.checked)} /> Tüm sayfaları görselden yeniden oku (daha yavaş)</label>
      <label>Okunacak poliçe PDF’si <input aria-label="Okunacak poliçe PDF’si" type="file" accept=".pdf,application/pdf" onChange={event => { void read(event.target.files?.[0]); event.target.value = ''; }} /></label>
    </fieldset>
    <p role="status" aria-live="polite">{message}</p>
    {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
    {busy && <button type="button" onClick={() => controller.current?.abort()}>Okumayı durdur</button>}
    {file && document && review && <fieldset disabled={busy} style={fieldset}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <strong>{file.name}</strong>
        <label>İncelenecek sayfa <select aria-label="İncelenecek PDF sayfası" value={scope ?? ''} onChange={event => showReview(document, event.target.value ? Number(event.target.value) : undefined)}>
          <option value="">Tüm sayfalar</option>
          {document.pages.map(page => <option key={page.number} value={page.number}>Sayfa {page.number}{page.method === 'ocr' ? ' — görselden okundu' : ''}</option>)}
        </select></label>
        <a href={`${previewUrl}#page=${scope || 1}`} target="_blank" rel="noopener noreferrer">PDF’yi aç</a>
        <button type="button" onClick={() => void read(file, true)}>Görselden yeniden dene</button>
      </div>
      <p><strong>{Object.keys(review.fields).length} alan bulundu.</strong> Seçili alanlar formdaki değerlerin yerine geçer. Uyarılı alanlar ilk okumada otomatik seçilmez.</p>
      {scope !== undefined && <p style={{ fontSize: '0.82rem', color: '#475569' }}>Sayfa {scope} üzerindeki bilgiler aktarılacak; ek olarak PDF dosyasının tamamı saklanacak.</p>}
      {review.missingFields.length > 0 && <p style={{ color: '#92400e' }}>Eksik temel alanlar: {review.missingFields.map(key => policyPdfLabels[key]).join(', ')}.</p>}
      {review.warnings.length > 0 && <ul style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '12px 12px 12px 30px', color: '#92400e' }}>{review.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
        {keys.map(key => {
          const evidence = pickedEvidence[key] || review.evidence[key];
          const choices = review.choices[key] || [];
          const hasDifferentChoices = new Set(choices.map(choice => choice.value.toLocaleLowerCase('tr-TR'))).size > 1;
          return <div key={key}>
            <label style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              <input type="checkbox" checked={selected.includes(key)} onChange={event => setSelected(previous => event.target.checked ? [...previous, key] : previous.filter(field => field !== key))} />
              {policyPdfLabels[key]}
            </label>
            <input aria-label={`PDF ${policyPdfLabels[key]}`} aria-invalid={!!validated.issues[key]} value={fields[key] || ''} placeholder="Bulunamadı — elle girebilirsiniz" style={{ width: '100%', padding: 8, border: validated.issues[key] ? '1px solid #dc2626' : '1px solid #cbd5e1', borderRadius: 6 }} onChange={event => editField(key, event.target.value)} />
            {validated.issues[key] && <p role="alert" style={{ color: '#b91c1c', fontSize: '0.78rem' }}>{validated.issues[key]}</p>}
            {review.fieldIssues[key]?.map(issue => <p key={issue} style={{ color: '#92400e', fontSize: '0.78rem', margin: '4px 0' }}>{issue}</p>)}
            {hasDifferentChoices && <select aria-label={`${policyPdfLabels[key]} için bulunan değerler`} value="" style={{ width: '100%', marginTop: 5 }} onChange={event => {
              const choice = choices[Number(event.target.value)];
              if (choice) editField(key, choice.value, choice);
            }}><option value="">Belgedeki farklı değerlerden seç…</option>{choices.map((choice, index) => <option key={index} value={index}>Sayfa {choice.page}: {choice.value}{choice.method === 'ocr' ? ' (görsel)' : ''}</option>)}</select>}
            {evidence && <details style={{ fontSize: '0.78rem', color: '#475569', marginTop: 4 }}><summary>Sayfa {evidence.page} — kaynak satırı</summary><p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{evidence.source}</p><a href={`${previewUrl}#page=${evidence.page}`} target="_blank" rel="noopener noreferrer">Bu sayfayı PDF’de aç</a></details>}
          </div>;
        })}
      </div>
      <details style={{ margin: '14px 0' }}><summary>Sayfalardan okunan metni kontrol et</summary><pre style={{ whiteSpace: 'pre-wrap', maxHeight: 250, overflow: 'auto' }}>{source}</pre></details>
      {review.documentKind === 'cancellation' && <p role="alert">İptal/fesih zeyli algılandı. Yeni aktif poliçe formuna aktarma kapalıdır; dosyayı ilgili mevcut poliçeye ekleyebilirsiniz.</p>}
      {review.multiplePolicies && <p role="alert">Farklı poliçelerin bilgilerini birleştirmemek için tek poliçeye ait sayfayı seçin. Aynı sayfada birden çok poliçe varsa ayrı dosyalarla işlem yapın.</p>}
      <button type="button" disabled={blocked || selectedInvalid || !selected.length} onClick={() => {
        if (blocked || selectedInvalid || !selected.length) return;
        onApply(validated.fields, file);
        setMessage('Seçili bilgiler forma aktarıldı ve PDF ek olarak seçildi. Formu kontrol edip kaydedin.');
      }} style={{ padding: '10px 16px', background: '#2563eb', color: 'white', border: 0, borderRadius: 8, cursor: 'pointer' }}>Seçili bilgileri forma aktar ve PDF’yi ekle</button>
    </fieldset>}
  </section>;
}
