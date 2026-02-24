'use client';

import React from 'react';
import { usePublicCollection } from './layout';
import { SeriesList } from '@/components/collection/SeriesList';
import { Book } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Manga, Series } from '@/types/manga';

interface GroupedSeries {
    series: Series;
    volumes: Manga[];
}

export default function PublicSeriesPage() {
    const { mangas, profile } = usePublicCollection();
    const params = useParams();
    const username = params.username as string;

    if (!profile) return null;

    // Grouping logic (similar to private collection)
    const groupedBySeries = mangas.reduce((acc, manga: Manga) => {
        const seriesId = manga.series?.id || 0;
        if (!acc[seriesId]) {
            acc[seriesId] = {
                series: manga.series || {
                    id: 0,
                    title: manga.title,
                    authors: manga.authors,
                    cover_url: manga.cover_url,
                    status: null,
                    total_volumes: null
                },
                volumes: []
            };
        }
        acc[seriesId].volumes.push(manga);
        return acc;
    }, {} as Record<number, GroupedSeries>);

    const seriesList = Object.values(groupedBySeries);

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
