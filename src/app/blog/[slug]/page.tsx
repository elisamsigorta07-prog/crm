import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { blogPosts } from '@/data/blog';
import styles from './page.module.css';

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const post = blogPosts.find((p) => p.id === resolvedParams.slug);
  
  if (!post) {
    return {
      title: 'Yazı Bulunamadı | Elisam Sigorta',
    };
  }

  return {
    title: `${post.title} | Elisam Sigorta Blog`,
    description: post.excerpt,
  };
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.id,
  }));
}

export default async function BlogPostPage({ params }: Props) {
  const resolvedParams = await params;
  const post = blogPosts.find((p) => p.id === resolvedParams.slug);

  if (!post) {
    notFound();
  }

  return (
    <main className={styles.postPage}>
      <div className="container">
        
        <div className={styles.postHeader}>
          <div className={styles.category}>{post.category}</div>
          <h1 className={styles.title}>{post.title}</h1>
        </div>

        <div className={styles.heroImage}>
          <img src={post.imageUrl} alt={post.title} />
        </div>

        <div className={styles.contentWrapper}>
          <div 
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: post.content }} 
          />
          
          <Link href="/blog" className={styles.backBtn}>
            <ArrowLeft size={18} /> Blog'a Dön
          </Link>
        </div>

      </div>
    </main>
  );
}

