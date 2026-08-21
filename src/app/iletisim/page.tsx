import { Metadata } from 'next';
import { MapPin, Phone, Mail } from 'lucide-react';
import styles from './page.module.css';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
  title: 'İletişim | Elisam Sigorta',
  description: 'Alanya Elisam Sigorta iletişim bilgileri, adres, telefon ve mesaj formu.',
};

export default function ContactPage() {
  return (
    <main className={styles.contactPage}>
      <div className="container">
        
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Bize Ulaşın</h1>
          <p className={styles.pageSubtitle}>
            Sigorta poliçeleriniz hakkında bilgi almak, teklif istemek veya sorularınız için 
            uzman ekibimizle dilediğiniz zaman iletişime geçebilirsiniz.
          </p>
        </div>

        <div className={styles.contactGrid}>
          
          {/* İletişim Bilgileri */}
          <div className={styles.contactInfoCard}>
            <h2 className={styles.infoTitle}>İletişim Bilgileri</h2>
            
            <div className={styles.infoItem}>
              <div className={styles.iconWrapper}>
                <MapPin size={24} />
              </div>
              <div className={styles.infoContent}>
                <h4>Adres</h4>
                <p>Mahmutlar Mah. Atatürk Cad.<br/>Flamingo 2 Sitesi 204/A<br/>Alanya / ANTALYA</p>
              </div>
            </div>

            <div className={styles.infoItem}>
              <div className={styles.iconWrapper}>
                <Phone size={24} />
              </div>
              <div className={styles.infoContent}>
                <h4>Telefon Numaraları</h4>
                <p>
                  <a href="tel:05514387771">0551 438 77 71 (Gsm / WhatsApp)</a><br/>
                  <a href="tel:02425288891">0242 528 88 91 (Sabit Hat)</a>
                </p>
              </div>
            </div>

            <div className={styles.infoItem}>
              <div className={styles.iconWrapper}>
                <Mail size={24} />
              </div>
              <div className={styles.infoContent}>
                <h4>E-Posta</h4>
                <p><a href="mailto:info@elisamsigorta.com">info@elisamsigorta.com</a></p>
              </div>
            </div>

            <div className={styles.socialMedia}>
              <h4>Bizi Takip Edin</h4>
              <div className={styles.socialLinks}>
                <a href="https://instagram.com/elisamsigorta" target="_blank" rel="noopener noreferrer" className={styles.socialBtn}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  @elisamsigorta
                </a>
              </div>
            </div>
          </div>

          {/* İletişim Formu */}
          <ContactForm />

        </div>

      </div>
    </main>
  );
}
