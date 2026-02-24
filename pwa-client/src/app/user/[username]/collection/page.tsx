'use client';

import React from 'react';
import { usePublicCollection } from './layout';
import { SeriesList } from '@/components/collection/SeriesList';
import { Book } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useGroupedCollection } from '@/hooks/useGroupedCollection';

export default function PublicSeriesPage() {
    const { mangas, profile } = usePublicCollection();
    const params = useParams();
    const username = params.username as string;

    // Hook must be called unconditionally (Rules of Hooks)
    const seriesList = useGroupedCollection(mangas);

    if (!profile) return null;

    return (
        <>
            {seriesList.length === 0 ? (
                <div className="text-center py-20">
                    <Book className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-300">Aucune série</h2>
                    <p className="text-slate-500">Cette collection est vide pour le moment.</p>
                </div>
            ) : (
                <SeriesList
                    seriesList={seriesList}
                    baseUrl={`/user/${username}/collection`}
                />
            )}
        </>
    );
}
