import type { Metadata } from 'next';
import { SearchClient } from './SearchClient';

export const metadata: Metadata = {
  title: 'Recherche — Mangastore',
};

export default function SearchPage() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-4 pb-6 lg:max-w-4xl">
      <SearchClient />
    </div>
  );
}
