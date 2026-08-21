import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { blogPosts } from '@/data/blog';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Blog | Elisam Sigorta',
  description: 'Sigorta sektörü, kasko, trafik, sağlık ve konut sigortaları hakkında güncel bilgiler ve rehber içerikler.',
};

export default function BlogPage() {
  return (
    <main className={styles.blogPage}>
      <div className="container">
        
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Sigorta Rehberi & Blog</h1>
          <p className={styles.pageSubtitle}>
            Uzmanlarımız tarafından hazırlanan güncel yazılarımızla sigorta dünyasındaki 
            gelişmeleri ve bilmeniz gereken tüm detayları keşfedin.
          </p>
        </div>

        <div className={styles.blogGrid}>
          {blogPosts.map((post) => (
            <article key={post.id} className={styles.blogCard}>
              <div className={styles.imageWrapper}>
                <div className={styles.categoryBadge}>{post.category}</div>
                <img src={post.imageUrl} alt={post.title} />
              </div>
              
              <div className={styles.cardContent}>
                <div className={styles.metaInfo}>
                  <div className={styles.metaItem}>
                    <Calendar size={16} />
                    <span>{new Date(post.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <Clock size={16} />
                    <span>{post.readTime}</span>
                  </div>
                </div>

                <h2 className={styles.title}>{post.title}</h2>
                <p className={styles.excerpt}>{post.excerpt}</p>
                
                <Link href={`/blog/${post.id}`} className={styles.readMoreBtn}>
                  Yazıyı Oku <ChevronRight size={18} />
                </Link>
              </div>
            </article>
          ))}
        </div>

      </div>
    </main>
  );
}
