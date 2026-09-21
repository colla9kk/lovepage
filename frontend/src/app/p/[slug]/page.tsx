import type { Metadata } from 'next';
import { API_URL } from '@/lib/api';
import GiftPageClient from './GiftPageClient';

type GiftPageData = {
  nomeCasal: string;
  fotoUrl: string;
  theme?: 'romantic' | 'friend' | 'family' | 'midnight' | 'minimal';
};

type Props = {
  params: Promise<{ slug: string }>;
};

async function getGift(slug: string): Promise<GiftPageData | null> {
  try {
    const res = await fetch(`${API_URL}/api/pages/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const gift = await getGift(slug);

  if (!gift) {
    return {
      title: 'Presente não encontrado | LovePage',
      description: 'Esta surpresa não está disponível.',
      robots: { index: false, follow: false },
    };
  }

  const title = `${gift.nomeCasal} ❤️ | LovePage`;
  const description = gift.theme === 'friend'
    ? 'Uma página especial feita para celebrar uma amizade inesquecível. Abra para ver o presente completo 🤝'
    : gift.theme === 'family'
      ? 'Uma homenagem especial feita com carinho para alguém da família. Abra para ver o presente completo 🏡'
      : 'Uma surpresa especial feita com amor. Abra para ver o presente completo 💖';
  const imageUrl = `${API_URL}/api/pages/${encodeURIComponent(slug)}/photo`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: 'website',
      images: [{ url: imageUrl, alt: `Presente de ${gift.nomeCasal}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function PaginaCasal({ params }: Props) {
  const { slug } = await params;
  return <GiftPageClient slug={slug} />;
}
