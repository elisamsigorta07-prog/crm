import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni | Elisam Sigorta',
  description: 'Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma metnimiz.',
};

export default function KVKKPage() {
  return (
    <main style={{ padding: '120px 0 80px 0', minHeight: '100vh', backgroundColor: '#fff' }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.2rem', color: 'var(--primary-color)', marginBottom: '1.5rem' }}>
          KVKK Aydınlatma Metni
        </h1>
        
        <div style={{ lineHeight: '1.8', color: '#444', fontSize: '1.05rem' }}>
          <p style={{ marginBottom: '1rem' }}>
            <strong>Elisam Sigorta Aracılık Hizmetleri</strong> ("Şirket") olarak, kişisel verilerinizin güvenliğine ve gizliliğine büyük önem veriyoruz. 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, "Veri Sorumlusu" sıfatıyla, kişisel verileriniz aşağıda açıklanan amaçlar kapsamında ve mevzuatın öngördüğü sınırlar çerçevesinde işlenmektedir.
          </p>

          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-dark)', marginTop: '2rem', marginBottom: '1rem' }}>1. Kişisel Verilerin Hangi Amaçla İşleneceği</h2>
          <p style={{ marginBottom: '1rem' }}>
            Toplanan kişisel verileriniz; sigorta poliçesi tekliflerinin hazırlanması, poliçe üretimlerinin gerçekleştirilmesi, hasar süreçlerinin yönetilmesi, müşteri memnuniyetinin ölçülmesi ve yasal yükümlülüklerin yerine getirilmesi amaçlarıyla işlenmektedir.
          </p>

          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-dark)', marginTop: '2rem', marginBottom: '1rem' }}>2. İşlenen Kişisel Verilerin Kimlere ve Hangi Amaçla Aktarılabileceği</h2>
          <p style={{ marginBottom: '1rem' }}>
            Kişisel verileriniz, yasal düzenlemelerin izin verdiği kurum ve kuruluşlara, yetkili kamu mercilerine, sigorta şirketlerine ve iş ortaklarımıza yukarıda belirtilen amaçların gerçekleştirilmesi doğrultusunda aktarılabilmektedir.
          </p>

          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-dark)', marginTop: '2rem', marginBottom: '1rem' }}>3. İlgili Kişinin Hakları</h2>
          <p style={{ marginBottom: '1rem' }}>
            KVKK'nın 11. maddesi uyarınca veri sahipleri; kişisel verilerinin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme haklarına sahiptir.
          </p>

          <div style={{ marginTop: '3rem' }}>
            <Link href="/" style={{ color: 'var(--secondary-color)', fontWeight: 'bold', textDecoration: 'none' }}>
              &larr; Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
