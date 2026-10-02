import { Metadata } from 'next';
import ClientPage from './ClientPage';
import { Article } from '@/types';
import { getServerDocRest, getServerDocBySlugRest } from '@/lib/serverFirestore';

type Props = {
  params: Promise<{ id: string }>;
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://katalog.solotechnopark.id';

export const revalidate = 3600; // P9: ISR cache 3600 detik (1 Jam) — 0 Firestore reads untuk publik

async function fetchArticleServer(idOrSlug: string): Promise<Article | null> {
  try {
    let art = await getServerDocRest<Article>('articles', idOrSlug, 3600);
    if (!art) {
      art = await getServerDocBySlugRest<Article>('articles', idOrSlug, 3600);
    }
    return art;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const article = await fetchArticleServer(id);

    if (!article) {
      return {
        title: 'Artikel Tidak Ditemukan | Solo Technopark',
        description: 'Artikel yang Anda cari tidak tersedia atau telah diarsipkan.'
      };
    }

    const title = `${article.title} | Warta Solo Technopark`;
    const description = article.excerpt || article.content.substring(0, 160).replace(/[#*`_]/g, '');
    const ogImage = article.coverImageUrl || `${APP_URL}/icon-katalog-stp.svg`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${APP_URL}/artikel/${article.slug || article.id}`,
        siteName: 'Solo Technopark',
        type: 'article',
        publishedTime: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: article.title,
          }
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      }
    };
  } catch {
    return {
      title: 'Artikel & Warta | Solo Technopark',
      description: 'Berita, panduan, dan ulasan program Solo Technopark.'
    };
  }
}

export default async function ArticleDetailPage({ params }: Props) {
  const { id } = await params;
  const initialArticle = await fetchArticleServer(id);

  return <ClientPage initialArticle={initialArticle} idOrSlug={id} />;
}
