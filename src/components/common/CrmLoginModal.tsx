"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { X, ShieldCheck, CarFront } from 'lucide-react';
import styles from './CrmLoginModal.module.css';

interface CrmLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CrmLoginModal({ isOpen, onClose }: CrmLoginModalProps) {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>
        
        <h2 className={styles.modalTitle}>Sisteme Giriş Yapın</h2>
        
        <div className={styles.optionsGrid}>
          {/* Sigorta CRM */}
          <Link href="/crm/sigorta/login" className={`${styles.optionCard} ${styles.optionCardSigorta}`} onClick={onClose}>
            <div className={`${styles.iconWrapper} ${styles.iconSigorta}`}>
              <ShieldCheck size={36} />
            </div>
            <h3>Sigorta CRM</h3>
            <p>Sigorta poliçeleri ve müşteri yönetimi</p>
          </Link>

          {/* Rent A Car CRM */}
          <Link href="/crm/rent-a-car/login" className={`${styles.optionCard} ${styles.optionCardRent}`} onClick={onClose}>
            <div className={`${styles.iconWrapper} ${styles.iconRent}`}>
              <CarFront size={36} />
            </div>
            <h3>Rent A Car CRM</h3>
            <p>Araç kiralama ve filo yönetimi</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
