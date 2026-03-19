import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { PublicCollectionClient } from './PublicCollectionClient';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `Collection de @${username} — Mangastore`,
    description: `Collection publique de @${username} sur Mangastore.`,
  };
}

export default async function PublicCollectionPage({ params }: Props) {
  // Only the primitive username string is passed to the Client island
  // (server-serialization — no serialized objects crossing the boundary)
  const { username } = await params;

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--background)' }}
    >
      <div className="w-full max-w-2xl mx-auto px-4 pt-4 pb-6">
        {/* Back to profile */}
        <Link
          href={`/user/${username}`}
          className="inline-flex items-center gap-1 text-sm mb-4 transition-opacity hover:opacity-70"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <ChevronLeft size={15} aria-hidden />
          @{username}
        </Link>

        <PublicCollectionClient username={username} />
      </div>
    </div>
  );
}
