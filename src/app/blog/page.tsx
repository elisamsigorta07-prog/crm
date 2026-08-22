import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
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

