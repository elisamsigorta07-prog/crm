"use client";

import { useState } from 'react';
import { Send } from 'lucide-react';
import styles from './page.module.css';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct WhatsApp message
    const text = `Merhaba Elisam Sigorta,\n\nWeb siteniz üzerinden yeni bir mesajım var:\n\n*İsim Soyisim:* ${formData.name}\n*Telefon:* ${formData.phone}\n*Konu:* ${formData.subject}\n*Mesaj:* ${formData.message}`;
    
    // Create WhatsApp wa.me link
    const waUrl = `https://wa.me/905514387771?text=${encodeURIComponent(text)}`;
    
    // Open in new tab
    window.open(waUrl, '_blank');
  };

  return (
    <div className={styles.contactFormCard}>
      <h2 className={styles.formTitle}>Mesaj Gönderin</h2>
      <p className={styles.formSubtitle}>Formu doldurarak bize hızlıca mesaj bırakabilirsiniz. Sistem sizi doğrudan WhatsApp hattımıza yönlendirecektir.</p>
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="name">Adınız Soyadınız</label>
          <input type="text" id="name" value={formData.name} onChange={handleChange} className={styles.formInput} placeholder="Örn: Ahmet Yılmaz" required />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="phone">Telefon Numaranız</label>
          <input type="tel" id="phone" value={formData.phone} onChange={handleChange} className={styles.formInput} placeholder="Örn: 0555 123 45 67" required />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="subject">Konu</label>
          <select id="subject" value={formData.subject} onChange={handleChange} className={styles.formInput} required>
            <option value="">Seçiniz...</option>
            <option value="Kasko Teklifi">Kasko Teklifi İstiyorum</option>
            <option value="Trafik Teklifi">Trafik Sigortası Teklifi İstiyorum</option>
            <option value="Sağlık Teklifi">Sağlık Sigortası Hakkında Bilgi</option>
            <option value="Diğer">Diğer Konular</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="message">Mesajınız</label>
          <textarea id="message" value={formData.message} onChange={handleChange} className={styles.formTextarea} placeholder="Bize iletmek istediklerinizi yazın..." required></textarea>
        </div>

        <button type="submit" className={styles.submitBtn}>
          WhatsApp'a Gönder <Send size={18} />
        </button>
      </form>
    </div>
  );
}
