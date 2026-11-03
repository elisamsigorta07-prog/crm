'use client';

import { useEffect, useState } from 'react';
import { getPolicyDocument, openPolicyDocument, migrateLocalPolicyDocument, type PolicyDocument } from '@/lib/policyDocuments';

export default function PolicyDocumentView({ policyId }: { policyId: string }) {
  const [document, setDocument] = useState<PolicyDocument | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    getPolicyDocument(policyId).then(value => { if (active) setDocument(value); })
      .catch(error => { if (active) setError(error instanceof Error ? error.message : 'PDF bilgisi yüklenemedi.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [policyId]);
  async function open(download: boolean) {
    setBusy(true); setError('');
    try { await openPolicyDocument(policyId, download); }
    catch (error) { setError(error instanceof Error ? error.message : 'PDF açılamadı.'); }
    finally { setBusy(false); }
  }
  return <div style={{ padding: 14, border: '1px solid #cbd5e1', borderRadius: 10, marginBottom: 16 }}>
    <strong>Poliçe PDF dosyası</strong>
    {document ? <><p>{document.name} ({(document.size / 1024 / 1024).toFixed(2)} MB)</p>
      <p>{document.storage === 'cloud' ? 'Supabase özel bulut deposunda saklanıyor. Yetkili hesapla başka cihazlardan da erişilebilir.' : 'Eski PDF yalnızca bu tarayıcıda. Kalıcı saklamak için buluta aktarın.'}</p>
      {document.storage === 'local' && <button type="button" disabled={busy} onClick={async () => {
        setBusy(true); setError('');
        try { setDocument(await migrateLocalPolicyDocument(policyId)); }
        catch (error) { setError(error instanceof Error ? error.message : 'Buluta aktarılamadı.'); }
        finally { setBusy(false); }
      }}>Eski PDF’yi Supabase’e aktar</button>}
      <button type="button" disabled={busy} onClick={() => void open(false)}>PDF’yi görüntüle</button>{' '}
      <button type="button" disabled={busy} onClick={() => void open(true)}>PDF’yi indir</button>
    </> : loading ? <p role="status">Buluttaki PDF eki kontrol ediliyor…</p> : !error ? <p>Poliçeye ekli PDF bulunmuyor. Eklemek için poliçeyi düzenleyin.</p> : null}
    {error && <p role="alert">{error}</p>}
  </div>;
}
