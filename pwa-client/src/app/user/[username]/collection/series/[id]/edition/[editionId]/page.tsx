'use client';

import React from 'react';
import { usePublicCollection } from '../../../../layout';
import { VolumeGrid } from '@/components/collection/VolumeGrid';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Manga } from '@/types/manga';

export default function PublicVolumesPage() {
    const { mangas, profile } = usePublicCollection();
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;
    const editionId = params.editionId as string;

    if (!profile) return null;

    const editionMangas = mangas.filter(m => m.edition?.id.toString() === editionId);

    if (editionMangas.length === 0) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                </Button>
                <div className="p-8 text-center text-slate-500">
                    Édition introuvable ou vide.
                </div>
            </div>
        );
    }

    const series = editionMangas[0].series!;
    const edition = editionMangas[0].edition!;

    // Identify which volumes are in collection
    const possessedNumbers = new Set(
        editionMangas
            .filter((m: Manga) => m.is_owned)
            .map((m: Manga) => parseInt(m.number || '0'))
            .filter((n: number) => !isNaN(n) && n > 0)
    );

    const maxPossessed = possessedNumbers.size > 0 ? Math.max(...Array.from(possessedNumbers)) : 0;
    const totalTomes = Math.max(edition.total_volumes || 0, series.total_volumes || 0, maxPossessed);

    const volumesUI = [];
    for (let i = 1; i <= totalTomes; i++) {
        const possessedManga = editionMangas.find((m: Manga) => parseInt(m.number || '0') === i);
        const isPossessed = possessedManga?.is_owned || false;

        volumesUI.push({
            id: possessedManga?.id,
            number: i,
            isPossessed,
            cover_url: possessedManga?.cover_url || series.cover_url || null,
            manga: possessedManga || null,
        });
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <Button variant="ghost" asChild className="mb-2 text-slate-400 hover:text-white group -ml-4">
                        <Link href={`/user/${username}/collection/series/${series.id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> {series.title}
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-black">{edition.name}</h1>
                    <p className="text-slate-500">
                        {possessedNumbers.size} / {totalTomes} tomes possédés
                    </p>
                </div>
            </div>

            <VolumeGrid
                volumesUI={volumesUI}
                isReadOnly={true}
            />
        </div>
    );
}
