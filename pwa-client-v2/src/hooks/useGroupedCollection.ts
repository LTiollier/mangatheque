"use client";

import { useMemo } from "react";
import { Manga, GroupedSeries } from "@/types/manga";

/**
 * Groupe un tableau de Manga par série.
 * Les mangas sans série sont groupés sous une série synthétique.
 *
 * Règle Vercel `rerender-memo` : les deux useMemo sont distincts pour éviter
 * de recalculer le groupement quand seul le filtre change.
 */
export function useGroupedCollection(mangas: Manga[], searchQuery: string = ""): GroupedSeries[] {
    const filteredMangas = useMemo(() =>
        mangas.filter(manga =>
            manga.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (manga.series?.title.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
            (manga.authors?.some(author => author.toLowerCase().includes(searchQuery.toLowerCase())) ?? false)
        ),
        [mangas, searchQuery]
    );

    return useMemo(() => {
        const grouped = filteredMangas.reduce((acc, manga) => {
            const seriesId = manga.series?.id || 0;
            if (!acc[seriesId]) {
                acc[seriesId] = {
                    series: manga.series || {
                        id: 0,
                        title: manga.title,
                        authors: manga.authors,
                        cover_url: manga.cover_url,
                    },
                    volumes: [],
                };
            }
            acc[seriesId].volumes.push(manga);
            return acc;
        }, {} as Record<number, GroupedSeries>);

        return Object.values(grouped);
    }, [filteredMangas]);
}
