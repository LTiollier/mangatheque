"use client";

import { Button } from '@/components/ui/button';
import { LucideBook, Plus, Search, Layers } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Manga, Series } from '@/types/manga';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface GroupedSeries {
    series: Series;
    volumes: Manga[];
}

export default function CollectionPage() {
    const [mangas, setMangas] = useState<Manga[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchMangas = async () => {
            try {
                const response = await api.get('/mangas');
                setMangas(response.data.data);
            } catch (error) {
                console.error('Failed to fetch mangas:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMangas();
    }, []);

    const filteredMangas = mangas.filter(manga =>
        manga.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manga.series?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manga.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const groupedBySeries = filteredMangas.reduce((acc, manga) => {
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                        <LucideBook className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Ma Collection</h1>
                        <p className="text-slate-500 text-sm">
                            {isLoading ? "Chargement..." : `${seriesList.length} séries, ${mangas.length} tomes`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Filtrer ma collection..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 w-full md:w-64"
                        />
                    </div>
                    <Button asChild className="bg-purple-600 hover:bg-purple-500 font-bold rounded-xl whitespace-nowrap">
                        <Link href="/search">
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter
                        </Link>
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="aspect-[2/3] animate-pulse bg-slate-900 rounded-2xl border border-slate-800" />
                    ))}
                </div>
            ) : seriesList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {seriesList.map(({ series, volumes }) => (
                        <Card key={series.id} className="overflow-hidden flex flex-col h-full bg-slate-900 border-slate-800 hover:border-purple-500/50 transition-all duration-300 group">
                            <Link href={`/collection/series/${series.id}`} className="flex-grow flex flex-col">
                                <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-800">
                                    {series.cover_url ? (
                                        <Image
                                            src={series.cover_url}
                                            alt={series.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-slate-600 italic text-sm text-center px-4">
                                            Pas de couverture
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 bg-purple-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg">
                                        {volumes.length} Tome{volumes.length > 1 ? 's' : ''}
                                    </div>
                                </div>
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-lg line-clamp-1 group-hover:text-purple-400 transition-colors">
                                        {series.title}
                                    </CardTitle>
                                    <p className="text-sm text-slate-500 line-clamp-1">
                                        {series.authors && series.authors.length > 0 ? series.authors.join(", ") : "Auteur inconnu"}
                                    </p>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <Layers className="h-3 w-3" />
                                        <span>
                                            {Array.from(new Set(volumes.map(v => v.edition?.name).filter(Boolean))).join(', ') || 'Édition Standard'}
                                        </span>
                                    </div>
                                </CardContent>
                            </Link>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="p-20 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl">
                    <div className="bg-slate-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800">
                        <LucideBook className="h-10 w-10 text-slate-700" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Aucune série trouvée</h3>
                    <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                        {searchQuery
                            ? "Aucun résultat ne correspond à votre recherche dans votre collection."
                            : "Votre collection est vide. Commencez par ajouter vos mangas préférés !"}
                    </p>
                    <Button asChild className="bg-purple-600 hover:bg-purple-500 font-bold rounded-xl px-8">
                        <Link href="/search">Rechercher un manga</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
