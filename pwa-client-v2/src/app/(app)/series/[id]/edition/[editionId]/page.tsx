import type { Metadata } from 'next';
import { EditionDetailClient } from './EditionDetailClient';

export const metadata: Metadata = {
  title: 'Édition — Mangastore',
};

interface Props {
  params: Promise<{ id: string; editionId: string }>;
}

/**
 * Server Component — reads [id] and [editionId] from route params.
 * Data fetching is client-side (EditionDetailClient) — same constraint as
 * other pages: session cookie forwarding not yet configured for RSC.
 */
export default async function EditionPage({ params }: Props) {
  const { id, editionId } = await params;
  const seriesId = parseInt(id, 10);
  const parsedEditionId = parseInt(editionId, 10);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-4 pb-6 lg:max-w-4xl">
      <EditionDetailClient
        seriesId={isNaN(seriesId) ? 0 : seriesId}
        editionId={isNaN(parsedEditionId) ? 0 : parsedEditionId}
      />
    </div>
  );
}
