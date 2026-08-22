import { notFound } from 'next/navigation';
import { getServiceById, servicesData, aliasMap } from '@/data/services';
import { Phone, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';
import { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const service = getServiceById(resolvedParams.slug);
  
  if (!service) {
    return {
      title: 'Hizmet Bulunamadı | Elisam Sigorta'
    };
  }

  return {
    title: `${service.title} | Elisam Sigorta Alanya`,
    description: service.shortDescription,
    keywords: service.seoKeywords,
  };
}

export function generateStaticParams() {
  const mainParams = servicesData.map((service) => ({ slug: service.id }));
  const aliasParams = Object.keys(aliasMap).map((slug) => ({ slug }));
  return [...mainParams, ...aliasParams];
}

export default async function ServicePage({ params }: Props) {
  const resolvedParams = await params;
  const service = getServiceById(resolvedParams.slug);

  if (!service) {
    notFound();
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <div className="container">
          <h1 className={styles.pageTitle}>{service.title}</h1>
          <p className={styles.pageSubtitle}>{service.shortDescription}</p>
        </div>
      </div>

      <div className={`container ${styles.contentSection}`}>
        <div className={styles.contentGrid}>
          
          <main>
            <div className={styles.imageWrap}>
              <img src={service.image} alt={service.title} />
            </div>
            
            {/* Show the banner if available */}
            {service.bannerImage && (
              <div style={{ marginTop: '2rem', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <img src={service.bannerImage} alt={`${service.title} Kampanya`} style={{ width: '100%', display: 'block' }} />
              </div>
            )}
            
            <div 
              className={styles.textContent}
              style={{ marginTop: '2rem' }}
              dangerouslySetInnerHTML={{ __html: service.content }} 
            />
          </main>

          <aside>
            <div className={styles.sidebar}>
              <h3>Hızlı Teklif Alın</h3>
              <p style={{ marginBottom: '1rem', color: 'var(--text-light)', fontSize: '0.95rem' }}>
                {service.title} için Alanya'daki en uygun fiyat teklifini dakikalar içinde WhatsApp üzerinden alın.
              </p>
              
              <a 
                href={`https://wa.me/905514387771?text=${encodeURIComponent(`Merhaba, ${service.title} hakkında bilgi ve en uygun fiyat teklifini almak istiyorum.`)}`}
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-primary" 
                style={{ width: '100%', marginBottom: '1rem', textDecoration: 'none', display: 'inline-flex', justifyContent: 'center' }}
              >
                WhatsApp'tan Teklif Alın
              </a>
              
              <a href="tel:+905514387771" className="btn btn-outline" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <Phone size={18} /> Bizi Arayın
              </a>

              <div style={{ marginTop: '2rem' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Diğer Çözümlerimiz</h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {servicesData.filter(s => s.id !== service.id).map(s => (
                    <li key={s.id} style={{ marginBottom: '10px' }}>
                      <Link href={`/hizmetler/${s.id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dark)', textDecoration: 'none' }}>
                        <ArrowRight size={14} color="var(--secondary-color)" />
                        <span style={{ transition: 'color 0.2s ease' }}>{s.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </>
  );
}
