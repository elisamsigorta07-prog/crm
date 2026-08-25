"use client";

import { useState } from 'react';
import { ShieldCheck, Users, Clock, CheckCircle, ArrowRight, Home as HomeIcon, Building, Briefcase, Car, HeartPulse, Shield, HardHat, ShieldAlert, UserCheck, Headset, MapPin, PhoneCall, FileText, Wallet, ChevronRight, Lock, FileSearch, Check, Star, Award, Building2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';
import { servicesData } from '@/data/services';
import { blogPosts } from '@/data/blog';
import { useLanguage } from '@/context/LanguageContext';

const iconMap: Record<string, any> = {
  HomeIcon: HomeIcon,
  Building: Building,
  Briefcase: Briefcase,
  Car: Car,
  HeartPulse: HeartPulse,
  Shield: Shield,
  HardHat: HardHat,
  ShieldAlert: ShieldAlert,
};

export default function Home() {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<string | null>(null);

  const faqs = [
    {
      q: 'DASK zorunlu mu?',
      a: 'Evet, 6305 sayılı Afet Sigortaları Kanunu gereğince elektrik, su, doğalgaz abonelik işlemleri ve tapu devirlerinde DASK poliçesi zorunludur.'
    },
    {
      q: 'Kasko ile trafik sigortası farkı nedir?',
      a: 'Zorunlu Trafik Sigortası olası bir kaza anında karşı tarafın zararını öder. Kasko ise isteğe bağlı olup kendi aracınızdaki hasarları, çalınma, yangın ve felaket durumlarını karşılar.'
    },
    {
      q: 'Hasar dosyası nasıl açılır?',
      a: 'Kaza anında 7/24 Elisam Sigorta ihbar hattımızdan veya WhatsApp üzerinden kaza tespit tutanağınızı göndererek dosyanızı dakikalar içinde açtırabilirsiniz.'
    },
    {
      q: 'Poliçemi iptal edebilir miyim?',
      a: 'Araç satışı, devir veya konut satışı gibi durumlarda kalan sürenin prim iadesi hesaplanarak poliçeniz anında iptal edilir.'
    }
  ];

  return (
    <>
      {/* Yeni Modern Arched Hero Section (Referans Tasarım Birebir) */}
      <section className={styles.archHero}>
        <div className="container">
          <div className={styles.archHeroGrid}>
            
            {/* Sol Taraf - Tipografi & Aksiyon */}
            <div className={styles.archHeroLeft}>
              <div className={styles.archHeroEyebrow}>
                GÜVENCENİZİ BİZİMLE SAĞLAYIN
              </div>

              <h1 className={styles.archHeroTitle}>
                Hayatın Her Anında <br />
                <span className={styles.archHeroHighlight}>Tam Güvence Yanınızda.</span>
              </h1>

              <p className={styles.archHeroSubtitle}>
                Kaza ve trafikten sağlığınıza, evinizden işyerinize kadar tüm risklere karşı 15+ lider sigorta şirketinden en avantajlı fiyat tekliflerini anında karşılaştırın.
              </p>

              {/* Aksiyon Butonları */}
              <div className={styles.archHeroBtnGroup}>
                <a 
                  href="https://wa.me/905514387771?text=Merhaba,%20sigorta%20teklifi%20almak%20istiyorum." 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.archPrimaryBtn}
                >
                  <span style={{ fontSize: '1.1rem' }}>💬</span>
                  <span>WhatsApp&apos;tan Hızlı Teklif Al</span>
                </a>

                <a href="tel:05514387771" className={styles.archPhoneBtn}>
                  <PhoneCall size={17} />
                  <span>0551 438 77 71</span>
                </a>
              </div>

              {/* Hızlı Kategori Butonları */}
              <div className={styles.archQuickPills}>
                <Link href="/hizmetler/kasko" className={styles.archPill}>
                  <Car size={15} color="#2563eb" />
                  <span>Kasko & Trafik</span>
                </Link>
                <Link href="/hizmetler/konut-sigortasi" className={styles.archPill}>
                  <HomeIcon size={15} color="#059669" />
                  <span>Konut & DASK</span>
                </Link>
                <Link href="/hizmetler/saglik-sigortasi" className={styles.archPill}>
                  <HeartPulse size={15} color="#dc2626" />
                  <span>Sağlık Sigortası</span>
                </Link>
                <Link href="/hizmetler/isyeri-sigortasi" className={styles.archPill}>
                  <Briefcase size={15} color="#d97706" />
                  <span>İşyeri & KOBİ</span>
                </Link>
              </div>
            </div>

            {/* Sağ Taraf - Yuvarlak Kemer (Arch) İçinde Cam Fanus Görseli & Yüzen Rozet */}
            <div className={styles.archHeroRight}>
              
              {/* Arka Plandaki Mavi Dekoratif Kemer & Gölge */}
              <div className={styles.archBackdropGlow}></div>
              
              {/* Kemerli Görsel Çerçevesi */}
              <div className={styles.archFrame}>
                <img 
                  src="/hero-dome.jpg" 
                  alt="Elisam Sigorta - Güvenli Gelecek ve Tam Koruma" 
                  className={styles.archImg}
                />
              </div>

              {/* Yüzen Güven Rozet Kartı (Referans Görseldeki Birebir Kart) */}
              <div className={styles.archFloatingBadge}>
                <div className={styles.archBadgeIconWrap}>
                  <ShieldCheck size={26} strokeWidth={2} color="#2563eb" />
                </div>
                <div className={styles.archBadgeText}>
                  <strong>Güvenliğiniz Bizim Önceliğimiz</strong>
                  <span>Hızlı, kolay ve şeffaf sigorta çözümleri.</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Agencies Marquee */}
      <div className={styles.marqueeWrapper}>
        <div className={styles.marqueeContent}>
          <img src="/agencies/ALLİNAZ.png" alt="Allianz" className={styles.marqueeLogo} />
          <img src="/agencies/ANA.png" alt="Ana Sigorta" className={styles.marqueeLogo} />
          <img src="/agencies/EMA.png" alt="Emaa Sigorta" className={styles.marqueeLogoLarge} />
          <img src="/agencies/HDI.png" alt="HDI Sigorta" className={styles.marqueeLogo} />
          <img src="/agencies/ak-sigorta-logo-png_seeklogo-5491.png" alt="Ak Sigorta" className={styles.marqueeLogoLarge} />
          <img src="/agencies/quickecs.png" alt="Quick Sigorta" className={styles.marqueeLogoMedium} />
          <img src="/agencies/sompo-sigorta3099.png" alt="Sompo Sigorta" className={styles.marqueeLogoLarge} />
        </div>
        <div className={styles.marqueeContent}>
          <img src="/agencies/ALLİNAZ.png" alt="Allianz" className={styles.marqueeLogo} />
          <img src="/agencies/ANA.png" alt="Ana Sigorta" className={styles.marqueeLogo} />
          <img src="/agencies/EMA.png" alt="Emaa Sigorta" className={styles.marqueeLogoLarge} />
          <img src="/agencies/HDI.png" alt="HDI Sigorta" className={styles.marqueeLogo} />
          <img src="/agencies/ak-sigorta-logo-png_seeklogo-5491.png" alt="Ak Sigorta" className={styles.marqueeLogoLarge} />
          <img src="/agencies/quickecs.png" alt="Quick Sigorta" className={styles.marqueeLogoMedium} />
          <img src="/agencies/sompo-sigorta3099.png" alt="Sompo Sigorta" className={styles.marqueeLogoLarge} />
        </div>
      </div>

      {/* Neden Biz? Section (Yüklenen Görsel Birebir Tasarımı) */}
      <section className={styles.whyUsSection}>
        <div className="container">
          
          {/* Header */}
          <div className={styles.whyUsHeader}>
            <div className={styles.whyUsBadge}>
              <span className={styles.whyUsBadgeLine}></span>
              {t.why_badge}
              <span className={styles.whyUsBadgeLine}></span>
            </div>
            <h2 className={styles.whyUsTitle}>{t.why_title}</h2>
            <p className={styles.whyUsSubtitle}>
              {t.why_subtitle}
            </p>
          </div>

          {/* 4 Cards Grid */}
          <div className={styles.whyUsGrid}>
            <div className={styles.whyUsCard}>
              <div className={styles.whyUsIconBadge}>
                <ShieldCheck size={36} strokeWidth={1.75} />
              </div>
              <h3 className={styles.whyUsCardTitle}>{t.why_card1_title}</h3>
              <p className={styles.whyUsCardDesc}>{t.why_card1_desc}</p>
              <div className={styles.whyUsCardWave}></div>
            </div>

            <div className={styles.whyUsCard}>
              <div className={styles.whyUsIconBadge}>
                <Users size={36} strokeWidth={1.75} />
              </div>
              <h3 className={styles.whyUsCardTitle}>{t.why_card2_title}</h3>
              <p className={styles.whyUsCardDesc}>{t.why_card2_desc}</p>
              <div className={styles.whyUsCardWave}></div>
            </div>

            <div className={styles.whyUsCard}>
              <div className={styles.whyUsIconBadge}>
                <Clock size={36} strokeWidth={1.75} />
              </div>
              <h3 className={styles.whyUsCardTitle}>{t.why_card3_title}</h3>
              <p className={styles.whyUsCardDesc}>{t.why_card3_desc}</p>
              <div className={styles.whyUsCardWave}></div>
            </div>

            <div className={styles.whyUsCard}>
              <div className={styles.whyUsIconBadge}>
                <CheckCircle size={36} strokeWidth={1.75} />
              </div>
              <h3 className={styles.whyUsCardTitle}>{t.why_card4_title}</h3>
              <p className={styles.whyUsCardDesc}>{t.why_card4_desc}</p>
              <div className={styles.whyUsCardWave}></div>
            </div>
          </div>

          {/* Bottom Pill Action Banner */}
          <div className={styles.whyUsPillBanner}>
            <div className={styles.whyUsPillLeft}>
              <div className={styles.whyUsPillIcon}>
                <ShieldCheck size={22} strokeWidth={2} />
              </div>
              <span className={styles.whyUsPillText}>
                Güvenli, hızlı ve avantajlı çözümler için doğru yerdesiniz.
              </span>
            </div>
            <a 
              href="https://wa.me/905514387771?text=Merhaba,%20hızlı%20sigorta%20teklifi%20almak%20istiyorum." 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.whyUsPillBtn}
            >
              Hemen Teklif Al <ArrowRight size={18} />
            </a>
          </div>

        </div>
      </section>

      {/* Promosyon Banner (ANA SAYFA UYGUN BİR YER.png) */}
      <section className={styles.promoBannerSection} style={{ padding: '40px 0', backgroundColor: '#f8fafc' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            alignItems: 'center'
          }}>
            <div onClick={() => setSelectedBanner('/banners/ANA SAYFA UYGUN BİR YER.png')} style={{ display: 'block', cursor: 'pointer', transition: 'transform 0.2s', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <img 
                src="/banners/ANA SAYFA UYGUN BİR YER.png" 
                alt="Elisam Sigorta Fırsatları" 
                style={{ width: '100%', display: 'block' }}
              />
            </div>
            
            <div onClick={() => setSelectedBanner('/banners/ÖZEL SAĞLIK.png')} style={{ display: 'block', cursor: 'pointer', transition: 'transform 0.2s', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <img 
                src="/banners/ÖZEL SAĞLIK.png" 
                alt="Özel Sağlık Sigortası" 
                style={{ width: '100%', display: 'block' }}
              />
            </div>

            <div onClick={() => setSelectedBanner('/banners/SEYEHAT SİGORTASI.png')} style={{ display: 'block', cursor: 'pointer', transition: 'transform 0.2s', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <img 
                src="/banners/SEYEHAT SİGORTASI.png" 
                alt="Seyahat Sigortası" 
                style={{ width: '100%', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sigorta Çözümlerimiz Section (2. Yüklenen Görsel Birebir Tasarımı) */}
      <section id="cozumler" className={styles.solutionsSection}>
        <div className="container">
          
          {/* Header */}
          <div className={styles.solutionsHeader}>
            <div className={styles.solutionsBadge}>
              <span className={styles.solutionsBadgeLine}></span>
              <Shield size={16} style={{ margin: '0 2px' }} />
              {t.solutions_badge}
              <span className={styles.solutionsBadgeLine}></span>
            </div>
            <h2 className={styles.solutionsTitle}>{t.solutions_title}</h2>
            <p className={styles.solutionsSubtitle}>
              {t.solutions_subtitle}
            </p>
          </div>

          {/* 6 Cards Grid (3x2 Grid) */}
          <div className={styles.solutionsGrid}>
            {servicesData.slice(0, 6).map((service) => {
              const IconComponent = iconMap[service.icon] || Shield;
              return (
                <Link 
                  key={service.id} 
                  href={`/hizmetler/${service.id}`} 
                  className={styles.solutionCard}
                >
                  <div className={styles.solutionImageWrap}>
                    <img src={service.image} alt={service.title} className={styles.solutionImage} />
                  </div>
                  
                  <div className={styles.solutionContent}>
                    <div>
                      <div className={styles.solutionIconBadge}>
                        <IconComponent size={22} strokeWidth={1.8} />
                      </div>
                      <h3 className={styles.solutionCardTitle}>{service.title}</h3>
                      <p className={styles.solutionCardDesc}>{service.shortDescription}</p>
                    </div>

                    <div className={styles.solutionArrowBtn}>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Bottom Dark Banner */}
          <div className={styles.solutionsDarkBanner}>
            <div className={styles.solutionsDarkLeft}>
              <div className={styles.solutionsDarkIcon}>
                <ShieldCheck size={26} strokeWidth={2} />
              </div>
              <div>
                <h4 className={styles.solutionsDarkTitle}>{t.solutions_banner_title}</h4>
                <p className={styles.solutionsDarkSubtitle}>{t.solutions_banner_subtitle}</p>
              </div>
            </div>
            <a 
              href="https://wa.me/905514387771?text=Merhaba,%20sigorta%20çözümleriniz%20hakkında%20teklif%20almak%20istiyorum." 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.solutionsDarkBtn}
            >
              {t.solutions_banner_btn} <ArrowRight size={18} />
            </a>
          </div>

        </div>
      </section>

      {/* Hasar Sürecinde Yanınızdayız Section (3. Yüklenen Görsel Birebir Tasarımı) */}
      <section className={styles.claimSection}>
        <div className="container">
          
          {/* Header */}
          <div className={styles.claimHeader}>
            <div className={styles.claimBadge}>
              <Shield size={16} style={{ margin: '0 2px' }} />
              <span className={styles.claimBadgeLine}></span>
              {t.claim_badge}
              <span className={styles.claimBadgeLine}></span>
            </div>
            <h2 className={styles.claimTitle}>{t.claim_title}</h2>
            <p className={styles.claimSubtitle}>
              {t.claim_subtitle}
            </p>
          </div>

          {/* 4 Step Process Grid */}
          <div className={styles.claimGridWrap}>
            <div className={styles.claimGridLine}></div>
            
            <div className={styles.claimGrid}>
              
              {/* Step 01 */}
              <div className={styles.claimCardWrapper}>
                <div className={styles.claimCard} style={{ borderBottomColor: '#1e293b' }}>
                  <div className={styles.claimNumberBadge}>01</div>
                  
                  <div className={styles.claimCardBody}>
                    <div className={styles.claimIconBadge}>
                      <PhoneCall size={34} strokeWidth={1.75} />
                    </div>
                    <h3 className={styles.claimCardTitle}>{t.claim_step1_title}</h3>
                    <p className={styles.claimCardDesc}>
                      {t.claim_step1_desc}
                    </p>
                  </div>

                  <div className={styles.claimCardFooterTag}>
                    <PhoneCall size={16} color="#1e293b" /> {t.claim_step1_tag}
                  </div>
                </div>

                <div className={styles.claimArrowBetween}>
                  <ChevronRight size={18} />
                </div>
              </div>

              {/* Step 02 */}
              <div className={styles.claimCardWrapper}>
                <div className={styles.claimCard} style={{ borderBottomColor: '#2563eb' }}>
                  <div className={styles.claimNumberBadge}>02</div>
                  
                  <div className={styles.claimCardBody}>
                    <div className={styles.claimIconBadge}>
                      <FileText size={34} strokeWidth={1.75} />
                    </div>
                    <h3 className={styles.claimCardTitle}>{t.claim_step2_title}</h3>
                    <p className={styles.claimCardDesc}>
                      {t.claim_step2_desc}
                    </p>
                  </div>

                  <div className={styles.claimCardFooterTag}>
                    <ShieldCheck size={16} color="#2563eb" /> {t.claim_step2_tag}
                  </div>
                </div>

                <div className={styles.claimArrowBetween}>
                  <ChevronRight size={18} />
                </div>
              </div>

              {/* Step 03 */}
              <div className={styles.claimCardWrapper}>
                <div className={styles.claimCard} style={{ borderBottomColor: '#3b82f6' }}>
                  <div className={styles.claimNumberBadge}>03</div>
                  
                  <div className={styles.claimCardBody}>
                    <div className={styles.claimIconBadge}>
                      <UserCheck size={34} strokeWidth={1.75} />
                    </div>
                    <h3 className={styles.claimCardTitle}>{t.claim_step3_title}</h3>
                    <p className={styles.claimCardDesc}>
                      {t.claim_step3_desc}
                    </p>
                  </div>

                  <div className={styles.claimCardFooterTag}>
                    <UserCheck size={16} color="#3b82f6" /> {t.claim_step3_tag}
                  </div>
                </div>

                <div className={styles.claimArrowBetween}>
                  <ChevronRight size={18} />
                </div>
              </div>

              {/* Step 04 */}
              <div className={styles.claimCardWrapper}>
                <div className={styles.claimCard} style={{ borderBottomColor: '#22c55e' }}>
                  <div className={styles.claimNumberBadge}>04</div>
                  
                  <div className={styles.claimCardBody}>
                    <div className={styles.claimIconBadge}>
                      <CheckCircle size={34} strokeWidth={1.75} />
                    </div>
                    <h3 className={styles.claimCardTitle}>{t.claim_step4_title}</h3>
                    <p className={styles.claimCardDesc}>
                      {t.claim_step4_desc}
                    </p>
                  </div>

                  <div className={styles.claimCardFooterTag}>
                    <Wallet size={16} color="#22c55e" /> {t.claim_step4_tag}
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 3 Adımda Sigortan Hazır Section (4. Yüklenen Görsel Birebir Tasarımı) */}
      <section className={styles.stepProcessSection}>
        <div className="container">
          <div className={styles.stepProcessGrid}>
            
            {/* Left Column */}
            <div>
              <span className={styles.stepLeftBadge}>{t.step_badge}</span>
              <h2 className={styles.stepLeftTitle}>{t.step_title}</h2>
              <p className={styles.stepLeftSubtitle}>
                {t.step_subtitle}
              </p>

              <div className={styles.stepLeftFeatureList}>
                <div className={styles.stepLeftFeatureItem}>
                  <div className={styles.stepLeftFeatureIcon}>
                    <Lock size={18} strokeWidth={2} />
                  </div>
                  <span>{t.step_feat1}</span>
                </div>

                <div className={styles.stepLeftFeatureItem}>
                  <div className={styles.stepLeftFeatureIcon}>
                    <Clock size={18} strokeWidth={2} />
                  </div>
                  <span>{t.step_feat2}</span>
                </div>

                <div className={styles.stepLeftFeatureItem}>
                  <div className={styles.stepLeftFeatureIcon}>
                    <ShieldCheck size={18} strokeWidth={2} />
                  </div>
                  <span>{t.step_feat3}</span>
                </div>
              </div>

              <a 
                href="https://wa.me/905514387771?text=Merhaba,%203%20adımda%20hızlı%20sigorta%20teklifi%20almak%20istiyorum." 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.stepLeftBtn}
              >
                {t.hero_cta1} <ArrowRight size={18} />
              </a>
            </div>

            {/* Right Column: 3 Step Cards Flow */}
            <div className={styles.stepCardsWrap}>
              <div className={styles.stepDashedLine}></div>

              <div className={styles.stepCardsGrid}>
                
                {/* Step 1 */}
                <div className={styles.stepCardItem}>
                  <div className={styles.stepCard}>
                    <div className={styles.stepCardNumber}>1</div>
                    
                    <div>
                      <div className={styles.stepCardIconBadge}>
                        <UserCheck size={32} strokeWidth={1.75} />
                      </div>
                      <h3 className={styles.stepCardTitle}>{t.step_card1_title}</h3>
                      <div className={styles.stepCardLineDivider}></div>
                      <p className={styles.stepCardDesc}>
                        {t.step_card1_desc}
                      </p>
                    </div>

                    {/* Step 1 Visual Mockup */}
                    <div className={styles.stepMockupBox}>
                      <div className={styles.mockupForm}>
                        <div className={styles.mockupInputRow}>
                          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>👤 Ad Soyad...</span>
                        </div>
                        <div className={styles.mockupInputRow}>
                          <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>————————</span>
                        </div>
                        <div className={styles.mockupBtnBlue}>
                          <ArrowRight size={12} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.stepArrowRight}>
                    <ChevronRight size={14} />
                  </div>
                </div>

                {/* Step 2 */}
                <div className={styles.stepCardItem}>
                  <div className={styles.stepCard}>
                    <div className={styles.stepCardNumber}>2</div>
                    
                    <div>
                      <div className={styles.stepCardIconBadge}>
                        <FileSearch size={32} strokeWidth={1.75} />
                      </div>
                      <h3 className={styles.stepCardTitle}>{t.step_card2_title}</h3>
                      <div className={styles.stepCardLineDivider}></div>
                      <p className={styles.stepCardDesc}>
                        {t.step_card2_desc}
                      </p>
                    </div>

                    {/* Step 2 Visual Mockup */}
                    <div className={styles.stepMockupBox}>
                      <div className={styles.mockupQuotesGrid}>
                        <div className={styles.mockupQuoteCard}>
                          <span style={{ fontSize: '0.6rem', color: '#1e3a8a', fontWeight: 800 }}>AXA</span>
                          <div className={styles.mockupPrice}>₺4.250</div>
                          <Check size={10} color="#cbd5e1" style={{ marginTop: '2px' }} />
                        </div>

                        <div className={`${styles.mockupQuoteCard} ${styles.mockupQuoteCardActive}`}>
                          <span style={{ fontSize: '0.6rem', color: '#2563eb', fontWeight: 800 }}>Allianz</span>
                          <div className={styles.mockupPrice} style={{ color: '#2563eb' }}>₺3.750</div>
                          <Check size={12} color="#2563eb" style={{ marginTop: '2px' }} />
                        </div>

                        <div className={styles.mockupQuoteCard}>
                          <span style={{ fontSize: '0.6rem', color: '#1e3a8a', fontWeight: 800 }}>HDI</span>
                          <div className={styles.mockupPrice}>₺4.100</div>
                          <Check size={10} color="#cbd5e1" style={{ marginTop: '2px' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.stepArrowRight}>
                    <ChevronRight size={14} />
                  </div>
                </div>

                {/* Step 3 */}
                <div className={styles.stepCardItem}>
                  <div className={styles.stepCard}>
                    <div className={styles.stepCardNumber}>3</div>
                    
                    <div>
                      <div className={styles.stepCardIconBadge}>
                        <ShieldCheck size={32} strokeWidth={1.75} />
                      </div>
                      <h3 className={styles.stepCardTitle}>{t.step_card3_title}</h3>
                      <div className={styles.stepCardLineDivider}></div>
                      <p className={styles.stepCardDesc}>
                        {t.step_card3_desc}
                      </p>
                    </div>

                    {/* Step 3 Visual Mockup */}
                    <div className={styles.stepMockupBox}>
                      <div className={styles.mockupPolicy}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={14} color="#2563eb" />
                          <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#334155' }}>Poliçe Belgesi</span>
                        </div>
                        <div style={{ height: '4px', background: '#cbd5e1', borderRadius: '2px', width: '80%' }}></div>
                        <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', width: '60%' }}></div>
                        <div className={styles.mockupCheckBadgeGreen}>
                          <CheckCircle size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Rakamlarla Elisam Section (5. Yüklenen Görsel Birebir Tasarımı) */}
      <section className={styles.statsSection}>
        <div className="container">
          
          {/* Header */}
          <div className={styles.statsHeader}>
            <div className={styles.statsBadge}>
              <span className={styles.statsBadgeLine}></span>
              {t.stats_badge}
              <span className={styles.statsBadgeLine}></span>
            </div>
            <h2 className={styles.statsTitle}>{t.stats_title}</h2>
            <p className={styles.statsSubtitle}>
              {t.stats_subtitle}
            </p>
          </div>

          {/* 4 Stat Cards */}
          <div className={styles.statsGridWrap}>
            <div className={styles.statsGrid}>
              
              {/* Card 1 */}
              <div className={styles.statCardItem}>
                <div className={styles.statCard}>
                  <div className={styles.statIconBadgeWrap}>
                    <div className={styles.statIconBadge}>
                      <Users size={34} strokeWidth={1.75} />
                    </div>
                    <div className={styles.statIconArc}></div>
                  </div>
                  <div>
                    <div className={styles.statNumber}>5.000+</div>
                    <div className={styles.statLabel}>{t.stat_card1}</div>
                  </div>
                  <div className={styles.statBottomLine}></div>
                </div>
              </div>

              {/* Card 2 */}
              <div className={styles.statCardItem}>
                <div className={styles.statCard}>
                  <div className={styles.statIconBadgeWrap}>
                    <div className={styles.statIconBadge}>
                      <Building2 size={34} strokeWidth={1.75} />
                    </div>
                    <div className={styles.statIconArc}></div>
                  </div>
                  <div>
                    <div className={styles.statNumber}>25+</div>
                    <div className={styles.statLabel}>{t.stat_card2}</div>
                  </div>
                  <div className={styles.statBottomLine}></div>
                </div>
              </div>

              {/* Card 3 */}
              <div className={styles.statCardItem}>
                <div className={styles.statCard}>
                  <div className={styles.statIconBadgeWrap}>
                    <div className={styles.statIconBadge}>
                      <Star size={34} strokeWidth={1.75} />
                    </div>
                    <div className={styles.statIconArc}></div>
                  </div>
                  <div>
                    <div className={styles.statNumber}>%98</div>
                    <div className={styles.statLabel}>{t.stat_card3}</div>
                  </div>
                  <div className={styles.statBottomLine}></div>
                </div>
              </div>

              {/* Card 4 */}
              <div className={styles.statCardItem}>
                <div className={styles.statCard}>
                  <div className={styles.statIconBadgeWrap}>
                    <div className={styles.statIconBadge}>
                      <Award size={34} strokeWidth={1.75} />
                    </div>
                    <div className={styles.statIconArc}></div>
                  </div>
                  <div>
                    <div className={styles.statNumber}>10+</div>
                    <div className={styles.statLabel}>{t.stat_card4}</div>
                  </div>
                  <div className={styles.statBottomLine}></div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SSS ve Blog & Haberler Section (6. Yüklenen Görsel Birebir Tasarımı) */}
      <section className={styles.faqBlogSection}>
        <div className="container">
          
          {/* Top Carousel Dots Accent */}
          <div className={styles.topDotsWrap}>
            <span className={styles.topDot}></span>
            <span className={styles.topDot}></span>
            <span className={styles.topDotActive}></span>
            <span className={styles.topDot}></span>
          </div>

          <div className={styles.faqBlogGrid}>
            
            {/* Left FAQ Column */}
            <div>
              <div className={styles.faqBadge}>
                <span className={styles.faqBadgeLine}></span>
                {t.faq_badge}
                <span className={styles.faqBadgeLine}></span>
              </div>

              <div className={styles.faqList}>
                {faqs.map((faq, index) => {
                  const isOpen = openFaq === index;
                  return (
                    <div key={index} className={styles.faqItem}>
                      <div 
                        className={styles.faqHeader} 
                        onClick={() => setOpenFaq(isOpen ? null : index)}
                      >
                        <h4 className={styles.faqQuestion}>{faq.q}</h4>
                        <span className={styles.faqToggleBtn}>
                          {isOpen ? <Minus size={18} color="#2563eb" /> : <Plus size={18} color="#64748b" />}
                        </span>
                      </div>
                      {isOpen && (
                        <div className={styles.faqAnswer}>
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Blog Column */}
            <div>
              <div className={styles.blogHeaderRow}>
                <h3 className={styles.blogHeaderTitle}>{t.blog_title}</h3>
                <Link href="/blog" className={styles.blogAllBtn}>
                  {t.blog_all} <ArrowRight size={16} />
                </Link>
              </div>

              <div className={styles.homeBlogGrid}>
                {blogPosts.slice(0, 3).map((post) => (
                  <Link 
                    key={post.id} 
                    href={`/blog/${post.id}`} 
                    className={styles.homeBlogCard}
                  >
                    <div className={styles.homeBlogImageWrap}>
                      <img src={post.imageUrl} alt={post.title} className={styles.homeBlogImage} />
                    </div>

                    <div className={styles.homeBlogContent}>
                      <div>
                        <div className={styles.homeBlogMetaRow}>
                          <span className={styles.homeBlogCategoryBadge}>{post.category}</span>
                        </div>
                        <h4 className={styles.homeBlogTitle}>{post.title}</h4>
                        <p className={styles.homeBlogExcerpt}>{post.excerpt}</p>
                      </div>

                      <div className={styles.homeBlogReadMore}>
                        {t.read_more} <ArrowRight size={14} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* Features Section */}
      <section className={`section ${styles.sectionBgLight}`}>
        <div className="container">
          <div className={styles.featuresWrap}>
            
            <div className={styles.featuresText}>
              <span style={{ color: 'var(--secondary-color)', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                NEDEN ELİSAM SİGORTA?
              </span>
              <h2 className="h2" style={{ marginTop: '10px' }}>Güven, Şeffaflık ve Müşteri Memnuniyeti</h2>
              <p className="p-large">
                Müşterilerimize en iyi hizmeti sunmak için deneyimli kadromuz ve güçlü çözüm ortaklarımızla her zaman yanınızdayız.
              </p>
              <button className="btn btn-primary" style={{ marginTop: '1rem' }}>Hakkımızda Daha Fazla</button>
            </div>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <UserCheck className={styles.featureIcon} size={40} />
                <h4 style={{ marginBottom: '8px' }}>Birebir Danışmanlık</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Size özel çözümler için uzman danışmanlarımızla birebir görüşme imkanı.</p>
              </div>

              <div className={styles.featureItem}>
                <Headset className={styles.featureIcon} size={40} />
                <h4 style={{ marginBottom: '8px' }}>7/24 Destek</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Aklınıza takılan her konuda 7/24 destek hattımızdan bize ulaşabilirsiniz.</p>
              </div>

              <div className={styles.featureItem}>
                <MapPin className={styles.featureIcon} size={40} />
                <h4 style={{ marginBottom: '8px' }}>Geniş Anlaşmalı Ağ</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Türkiye genelinde geniş anlaşmalı servis ve kurum ağı avantajı.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedBanner && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={() => setSelectedBanner(null)}
        >
          <div style={{ position: 'relative', maxWidth: '1200px', width: '100%' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedBanner(null); }}
              style={{
                position: 'absolute',
                top: '-40px',
                right: 0,
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '2rem',
                cursor: 'pointer'
              }}
            >
              &times;
            </button>
            <img 
              src={selectedBanner} 
              alt="Büyütülmüş Banner" 
              style={{ width: '100%', height: 'auto', borderRadius: '16px', objectFit: 'contain', maxHeight: '85vh' }} 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
