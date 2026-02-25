'use client';

import React, { useMemo } from 'react';
import { usePublicCollection } from '../../layout';
import { EditionList } from '@/components/collection/EditionList';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Manga, Edition } from '@/types/manga';

export default function PublicEditionsPage() {
    const { mangas, profile } = usePublicCollection();
    const params = useParams();
    const router = useRouter();
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

    if (seriesMangas.length === 0) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                </Button>
                <div className="p-8 text-center text-slate-500">
                    Série introuvable ou vide.
                </div>
            </div>
        );
    }

    const series = seriesMangas[0].series!;

    if (!profile) return null;

    return (
        <div className="space-y-8">
            <Button variant="ghost" asChild className="mb-2 text-slate-400 hover:text-white group">
                <Link href={`/user/${username}/collection`}>
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Retour à la collection
                </Link>
            </Button>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="relative w-48 h-72 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl bg-slate-800 border-2 border-slate-700">
                    {series.cover_url ? (
                        <Image src={series.cover_url} alt={series.title} fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">Pas d&apos;image</div>
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
                    Mes Éditions
                </h2>

                <EditionList
                    series={series}
                    editionsList={editionsList}
                    baseUrl={`/user/${username}/collection/series/${seriesId}`}
                    isReadOnly={true}
                />
            </div>
        </div>
    );
}
