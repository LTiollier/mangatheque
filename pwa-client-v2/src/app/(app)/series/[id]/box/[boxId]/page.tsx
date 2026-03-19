import type { Metadata } from 'next';
import { BoxDetailClient } from './BoxDetailClient';

export const metadata: Metadata = {
  title: 'Boîte — Mangastore',
};

interface Props {
  params: Promise<{ id: string; boxId: string }>;
}

export default async function BoxPage({ params }: Props) {
  const { id, boxId } = await params;
  const seriesId = parseInt(id, 10);
  const parsedBoxId = parseInt(boxId, 10);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-4 pb-6 lg:max-w-4xl">
      <BoxDetailClient
        seriesId={isNaN(seriesId) ? 0 : seriesId}
        boxId={isNaN(parsedBoxId) ? 0 : parsedBoxId}
      />
    </div>
  );
}
