"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone, Lock } from 'lucide-react';
import styles from './Header.module.css';
import CrmLoginModal from '../common/CrmLoginModal';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { useLanguage } from '@/context/LanguageContext';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCrmModalOpen, setIsCrmModalOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();

  const navLinks = [
    { name: t.nav_home, href: '/' },
    { name: t.nav_about, href: '#hakkimizda' },
    { name: t.nav_solutions, href: '#cozumler' },
    { name: t.nav_blog, href: '/blog' },
    { name: t.nav_contact, href: '/iletisim' },
  ];

  if (pathname?.startsWith('/crm')) {
    return null;
  }

  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <img src="/logo.png" alt="Elisam Sigorta Logo" style={{ height: '70px', objectFit: 'contain' }} />
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.navLink}>
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Desktop Actions */}
        <div className={styles.actions}>
          <a href="tel:+905514387771" className={styles.phone}>
            <Phone size={17} />
            0551 438 77 71
          </a>

          {/* Language Switcher */}
          <LanguageSwitcher />

          <button className="btn btn-primary" style={{ fontSize: '0.88rem', padding: '9px 22px', borderRadius: '30px' }}>
            {t.get_quote}
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className={styles.mobileMenuBtn} 
          onClick={toggleMenu}
          aria-label="Menüyü Aç"
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

      </div>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.open : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <LanguageSwitcher />
        </div>
        <nav>
          <ul className={styles.mobileNavList}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link 
                  href={link.href} 
                  className={styles.mobileNavLink}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <a href="tel:+905514387771" className={styles.phone} style={{ justifyContent: 'center', fontSize: '1.2rem' }}>
            <Phone size={24} />
            0551 438 77 71
          </a>
          <button className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
            {t.get_quote}
          </button>
        </div>
      </div>

      <CrmLoginModal isOpen={isCrmModalOpen} onClose={() => setIsCrmModalOpen(false)} />
    </header>
  );
}
