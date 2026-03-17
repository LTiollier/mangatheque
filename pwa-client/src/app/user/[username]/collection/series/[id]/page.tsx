'use client';

import React, { useMemo } from 'react';
import { usePublicCollection } from '../../layout';
import { useParams } from 'next/navigation';
import { Manga, Edition } from '@/types/manga';
import { SeriesDetailView } from '@/components/series/SeriesDetailView';

export default function PublicEditionsPage() {
    const { mangas, profile } = usePublicCollection();
    const params = useParams();
    const username = params.username as string;
    const seriesId = params.id as string;

    const seriesMangas = useMemo(() =>
        mangas.filter((m: Manga) => m.series?.id.toString() === seriesId),
        [mangas, seriesId]);

    const editionsList = useMemo(() => {
        const editionsMap = new Map<number, { edition: Edition, volumes: Manga[] }>();
        seriesMangas.forEach((manga: Manga) => {
            if (manga.edition) {
                if (!editionsMap.has(manga.edition.id)) {
                    editionsMap.set(manga.edition.id, { edition: manga.edition, volumes: [] });
                }
                editionsMap.get(manga.edition.id)!.volumes.push(manga);
            }
        });
        return Array.from(editionsMap.values());
    }, [seriesMangas]);

    if (seriesMangas.length === 0 || !profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xl">Série introuvable ou vide</p>
            </div>
        );
    }

    const series = seriesMangas[0].series!;

    return (
        <SeriesDetailView
            series={series}
            volumes={seriesMangas}
            editionsList={editionsList}
            baseUrl={`/user/${username}/collection/series/${seriesId}`}
            backLink={`/user/${username}/collection`}
            backLabel="Retour à la collection"
            isReadOnly={true}
            editionsTitle="Mes Éditions"
        />
    );
}
