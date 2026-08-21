"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, Mail, MapPin, Lock } from 'lucide-react';
import styles from './Footer.module.css';
import { useLanguage } from '@/context/LanguageContext';
import CrmLoginModal from '../common/CrmLoginModal';

export default function Footer() {
  const [isCrmModalOpen, setIsCrmModalOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();

  if (pathname?.startsWith('/crm')) {
    return null;
  }

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerGrid}`}>
        
        {/* Brand Info */}
        <div className={styles.footerBrand}>
          <div style={{ marginBottom: '15px' }}>
            <img src="/logo.png" alt="Elisam Sigorta Logo" style={{ height: '60px', objectFit: 'contain' }} />
          </div>
          <p>{t.footer_desc}</p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className={styles.footerTitle}>{t.nav_home}</h4>
          <ul className={styles.footerLinks}>
            <li><Link href="/">{t.nav_home}</Link></li>
            <li><Link href="#hakkimizda">{t.nav_about}</Link></li>
            <li><Link href="#cozumler">{t.nav_solutions}</Link></li>
            <li><Link href="/iletisim">{t.nav_contact}</Link></li>
          </ul>
        </div>

        {/* Services */}
        <div>
          <h4 className={styles.footerTitle}>{t.nav_solutions}</h4>
          <ul className={styles.footerLinks}>
            <li><Link href="#">Kasko & Trafik</Link></li>
            <li><Link href="#">Sağlık Sigortası</Link></li>
            <li><Link href="#">Konut Sigortası</Link></li>
            <li><Link href="#">DASK</Link></li>
          </ul>
        </div>

        {/* Contact & CRM Entry */}
        <div>
          <h4 className={styles.footerTitle}>{t.nav_contact}</h4>
          <div className={styles.contactItem}>
            <Phone className={styles.contactIcon} size={20} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span>0551 438 77 71 (Gsm / WhatsApp)</span>
              <span>0242 528 88 91 (Sabit Hat)</span>
            </div>
          </div>
          <div className={styles.contactItem}>
            <Mail className={styles.contactIcon} size={20} />
            <span>info@elisamsigorta.com</span>
          </div>
          <div className={styles.contactItem}>
            <MapPin className={styles.contactIcon} size={20} style={{ minWidth: '20px', alignSelf: 'flex-start', marginTop: '5px' }} />
            <span>Mahmutlar Mah. Atatürk Cad.<br/>Flamingo 2 Sitesi 204/A<br/>Alanya / ANTALYA</span>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <button 
              onClick={() => setIsCrmModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '25px',
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease'
              }}
            >
              <Lock size={14} color="#60a5fa" /> {t.crm_login}
            </button>
          </div>
        </div>

      </div>

      <div className={`container ${styles.footerBottom}`}>
        <p>&copy; {new Date().getFullYear()} Elisam Sigorta. {t.footer_rights}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/kvkk">KVKK Aydınlatma Metni</Link>
          <Link href="/gizlilik-politikasi">Gizlilik Politikası</Link>
          
          <button 
            onClick={() => setIsCrmModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'underline'
            }}
          >
            <Lock size={13} color="#60a5fa" /> {t.crm_login}
          </button>
        </div>
      </div>

      <CrmLoginModal isOpen={isCrmModalOpen} onClose={() => setIsCrmModalOpen(false)} />
    </footer>
  );
}
