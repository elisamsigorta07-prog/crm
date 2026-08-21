import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası | Elisam Sigorta',
  description: 'Gizlilik politikamız ve çerez kullanım esaslarımız.',
};

export default function PrivacyPolicyPage() {
  return (
    <main style={{ padding: '120px 0 80px 0', minHeight: '100vh', backgroundColor: '#fff' }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.2rem', color: 'var(--primary-color)', marginBottom: '1.5rem' }}>
          Gizlilik Politikası
        </h1>
        
        <div style={{ lineHeight: '1.8', color: '#444', fontSize: '1.05rem' }}>
          <p style={{ marginBottom: '1rem' }}>
            <strong>Elisam Sigorta Aracılık Hizmetleri</strong> olarak, web sitemizi ziyaret eden tüm kullanıcılarımızın bilgi güvenliğini sağlamak öncelikli hedeflerimizdendir. Bu Gizlilik Politikası, web sitemizi kullanırken paylaştığınız verilerin nasıl korunduğunu açıklamaktadır.
          </p>

          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-dark)', marginTop: '2rem', marginBottom: '1rem' }}>Bilgi Toplama ve Kullanım</h2>
          <p style={{ marginBottom: '1rem' }}>
            Web sitemiz üzerinden "Teklif Al" veya "İletişim" formlarını doldurduğunuzda; adınız, soyadınız, telefon numaranız ve e-posta adresiniz gibi bilgileriniz sistemimize kaydedilir. Bu bilgiler sadece size poliçe teklifi sunmak ve iletişim kurmak amacıyla kullanılır. Kesinlikle ticari amaçlarla üçüncü partilere satılmaz veya kiralanmaz.
          </p>

          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-dark)', marginTop: '2rem', marginBottom: '1rem' }}>Veri Güvenliği</h2>
          <p style={{ marginBottom: '1rem' }}>
            Sistemlerimiz üzerinde toplanan veriler, yetkisiz erişimi engellemek adına SSL sertifikaları ve güncel şifreleme algoritmaları ile korunmaktadır. Sunucularımızda güvenlik duvarları (firewall) aktif olarak çalışmaktadır.
          </p>

          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-dark)', marginTop: '2rem', marginBottom: '1rem' }}>Çerezler (Cookies)</h2>
          <p style={{ marginBottom: '1rem' }}>
            Web sitemiz, kullanıcı deneyimini iyileştirmek için çerezler kullanmaktadır. Çerezler, tarayıcınız aracılığıyla cihazınıza kaydedilen ufak metin dosyalarıdır. Tarayıcı ayarlarınızdan çerezleri istediğiniz zaman kapatabilirsiniz.
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
