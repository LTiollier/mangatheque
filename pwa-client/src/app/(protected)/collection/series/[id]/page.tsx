"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Library, Plus } from 'lucide-react';
import api from '@/lib/api';
import { Manga, Series, Edition } from '@/types/manga';
import Link from 'next/link';

export default function SeriesPage() {
    const params = useParams();
    const router = useRouter();
    const seriesId = params.id as string;

    const [mangas, setMangas] = useState<Manga[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMangas = async () => {
            try {
                const response = await api.get('/mangas');
                const userMangas: Manga[] = response.data.data;
                const seriesMangas = userMangas.filter(m => m.series?.id.toString() === seriesId);
                setMangas(seriesMangas);
            } catch (error) {
                console.error('Failed to fetch mangas:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMangas();
    }, [seriesId]);

    if (isLoading) {
        return <div className="animate-pulse space-y-8">
            <div className="h-10 w-48 bg-slate-800 rounded"></div>
            <div className="h-32 w-full bg-slate-800 rounded"></div>
        </div>;
    }

    if (mangas.length === 0) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                </Button>
                <div className="p-8 text-center text-slate-500">
                    Série introuvable ou vous n'avez plus de mangas de cette série.
                </div>
            </div>
        );
    }

    const series = mangas[0].series as Series;
    const editionsMap = new Map<number, { edition: Edition, volumes: Manga[] }>();

    mangas.forEach(manga => {
        if (manga.edition) {
            if (!editionsMap.has(manga.edition.id)) {
                editionsMap.set(manga.edition.id, { edition: manga.edition, volumes: [] });
            }
            editionsMap.get(manga.edition.id)!.volumes.push(manga);
        }
    });

    const editionsList = Array.from(editionsMap.values());

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Button variant="ghost" asChild className="mb-2 text-slate-400 hover:text-white group">
                <Link href="/collection">
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Retour à la collection
                </Link>
            </Button>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-48 h-72 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl bg-slate-800 border-2 border-slate-700">
                    {series.cover_url ? (
                        <img src={series.cover_url} alt={series.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">Pas d'image</div>
                    )}
                </div>

                <div className="flex-1 space-y-4">
                    <h1 className="text-4xl font-black">{series.title}</h1>
                    <p className="text-purple-400 font-medium">
                        {series.authors ? series.authors.join(', ') : 'Auteurs inconnus'}
                    </p>
                    {series.description && (
                        <p className="text-slate-400 text-sm leading-relaxed max-w-2xl line-clamp-3">
                            {series.description}
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-800">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Library className="h-6 w-6 text-purple-500" />
                    Mes Éditions
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {editionsList.map(({ edition, volumes }) => {
                        // calculate progress
                        const total = edition.total_volumes || series.total_volumes;
                        const hasTotal = total && total > 0;
                        const possessedCount = volumes.length;
                        const percentage = hasTotal ? Math.min(100, (possessedCount / total) * 100) : null;

                        return (
                            <Card key={edition.id} className="bg-slate-900 border-slate-800 hover:border-purple-500/50 transition-all">
                                <Link href={`/collection/series/${series.id}/edition/${edition.id}`}>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-xl">{edition.name}</CardTitle>
                                        <div className="text-sm text-slate-500">
                                            {edition.publisher || 'Éditeur inconnu'} • {edition.language.toUpperCase()}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between items-end text-sm">
                                            <div>
                                                <span className="text-2xl font-bold text-white">{possessedCount}</span>
                                                <span className="text-slate-400"> tomes possédés</span>
                                            </div>
                                            {hasTotal && (
                                                <div className="text-slate-500">
                                                    sur {total}
                                                </div>
                                            )}
                                        </div>

                                        {hasTotal && (
                                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-1000"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        )}

                                        <Button className="w-full bg-slate-800 hover:bg-slate-700 text-purple-400 mt-2">
                                            <BookOpen className="mr-2 h-4 w-4" /> Voir les tomes
                                        </Button>
                                    </CardContent>
                                </Link>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
