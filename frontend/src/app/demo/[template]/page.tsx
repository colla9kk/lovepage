import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DemoGiftClient from './DemoGiftClient';

type Template = 'romantic' | 'friend' | 'family';
const validTemplates = new Set<Template>(['romantic', 'friend', 'family']);

export function generateStaticParams() {
  return [{ template: 'romantic' }, { template: 'friend' }, { template: 'family' }];
}

export async function generateMetadata({ params }: { params: Promise<{ template: string }> }): Promise<Metadata> {
  const { template } = await params;
  const titles: Record<Template, string> = {
    romantic: 'Exemplo Romântico | LovePage',
    friend: 'Exemplo de Amizade | LovePage',
    family: 'Exemplo para Família | LovePage',
  };

  if (!validTemplates.has(template as Template)) return { title: 'Exemplo | LovePage' };

  return {
    title: titles[template as Template],
    description: 'Veja como fica uma LovePage pronta antes de criar a sua.',
    robots: { index: false, follow: true },
  };
}

export default async function DemoPage({ params }: { params: Promise<{ template: string }> }) {
  const { template } = await params;
  if (!validTemplates.has(template as Template)) notFound();
  return <DemoGiftClient template={template as Template} />;
}
