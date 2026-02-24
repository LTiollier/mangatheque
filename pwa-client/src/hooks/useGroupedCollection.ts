"use client";

import { useMemo } from "react";
import { Manga, GroupedSeries } from "@/types/manga";

/**
 * Groups an array of Manga items by their Series.
 * Mangas without a series are grouped under a synthetic series built from the manga itself.
 */
export function useGroupedCollection(mangas: Manga[], searchQuery: string = ""): GroupedSeries[] {
    const filteredMangas = useMemo(() =>
        mangas.filter(manga =>
            manga.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (manga.series?.title.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
            manga.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase()))
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
                        status: null,
                        total_volumes: null,
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
