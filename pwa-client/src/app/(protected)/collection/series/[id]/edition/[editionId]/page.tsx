"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { Manga, Series, Edition } from '@/types/manga';
import Link from 'next/link';

export default function EditionPage() {
    const params = useParams();
    const router = useRouter();
    const seriesId = params.id as string;
    const editionId = params.editionId as string;

    const [mangas, setMangas] = useState<Manga[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMissing, setSelectedMissing] = useState<number[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const fetchMangas = async () => {
        try {
            const response = await api.get('/mangas');
            const userMangas: Manga[] = response.data.data;
            const editionMangas = userMangas.filter(m => m.edition?.id.toString() === editionId);
            setMangas(editionMangas);
        } catch (error) {
            console.error('Failed to fetch mangas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMangas();
    }, [editionId]);

    if (isLoading) {
        return <div className="animate-pulse space-y-8 p-8">
            <div className="h-10 w-48 bg-slate-800 rounded"></div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="aspect-[2/3] bg-slate-800 rounded-xl"></div>)}
            </div>
        </div>;
    }

    if (mangas.length === 0) {
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

    const series = mangas[0].series as Series;
    const edition = mangas[0].edition as Edition;

    // Find missing volumes
    const possessedNumbers = new Set(mangas.map(m => parseInt(m.number || '0')).filter(n => !isNaN(n) && n > 0));
    const maxPossessed = possessedNumbers.size > 0 ? Math.max(...Array.from(possessedNumbers)) : 0;
    const totalTomes = Math.max(edition.total_volumes || 0, series.total_volumes || 0, maxPossessed + 5);
    // Show some empty slots dynamically if no fixed total_volumes exists
    // actually just show max(total_volumes, maxPossessed + 5) slots.

    const volumesUI = [];
    for (let i = 1; i <= totalTomes; i++) {
        const isPossessed = possessedNumbers.has(i);
        const possessedManga = isPossessed ? mangas.find(m => parseInt(m.number || '0') === i) : null;

        volumesUI.push({
            number: i,
            isPossessed,
            cover_url: possessedManga?.cover_url || series.cover_url || null,
        });
    }

    const toggleSelection = (num: number) => {
        if (selectedMissing.includes(num)) {
            setSelectedMissing(selectedMissing.filter(n => n !== num));
        } else {
            setSelectedMissing([...selectedMissing, num]);
        }
    };

    const selectAllMissing = () => {
        const missing = [];
        for (let i = 1; i <= totalTomes; i++) {
            if (!possessedNumbers.has(i)) {
                missing.push(i);
            }
        }
        setSelectedMissing(missing);
    };

    const handleBulkAdd = async () => {
        if (selectedMissing.length === 0) return;
        setIsSaving(true);
        try {
            await api.post('/mangas/bulk', {
                edition_id: edition.id,
                numbers: selectedMissing,
            });
            // refresh data
            setSelectedMissing([]);
            await fetchMangas();
        } catch (error) {
            console.error('Failed to add volumes', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <Button variant="ghost" asChild className="mb-2 text-slate-400 hover:text-white group -ml-4">
                        <Link href={`/collection/series/${series.id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> {series.title}
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-black">{edition.name}</h1>
                    <p className="text-slate-500">
                        {possessedNumbers.size} / {totalTomes} tomes possédés
                    </p>
                </div>

                {selectedMissing.length > 0 && (
                    <div className="flex items-center gap-2 bg-purple-900/40 p-2 rounded-xl border border-purple-500/30">
                        <span className="px-3 text-purple-200 font-medium text-sm">
                            {selectedMissing.length} itème(s) sélectionné(s)
                        </span>
                        <Button
                            className="bg-purple-600 hover:bg-purple-500 font-bold"
                            onClick={handleBulkAdd}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                            Ajouter les tomes
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllMissing} className="border-slate-700 bg-slate-900 text-slate-300">
                    Sélectionner tous les manquants
                </Button>
                {selectedMissing.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedMissing([])} className="text-slate-400 hover:text-white">
                        Annuler
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {volumesUI.map((vol) => {
                    const isSelected = selectedMissing.includes(vol.number);

                    return (
                        <div
                            key={vol.number}
                            onClick={() => !vol.isPossessed && toggleSelection(vol.number)}
                            className={`
                                relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300
                                ${vol.isPossessed ? 'ring-2 ring-purple-500 border-none' : 'hover:scale-105'}
                                ${isSelected ? 'ring-4 ring-blue-500 scale-95' : ''}
                                ${!vol.isPossessed && !isSelected ? 'opacity-50 grayscale hover:grayscale-0 hover:opacity-80 border-2 border-dashed border-slate-600' : ''}
                            `}
                        >
                            {vol.cover_url ? (
                                <img src={vol.cover_url} alt={`Volume ${vol.number}`} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                                    Tome {vol.number}
                                </div>
                            )}

                            <div className="absolute top-0 inset-x-0 p-2 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start">
                                <span className="px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-md font-bold text-sm">
                                    #{vol.number}
                                </span>
                            </div>

                            {!vol.isPossessed && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {isSelected ? (
                                        <div className="bg-blue-500 text-white rounded-full p-1 animate-in zoom-in">
                                            <CheckCircle2 className="h-8 w-8" />
                                        </div>
                                    ) : (
                                        <div className="bg-black/40 text-white rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity">
                                            <Circle className="h-8 w-8" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {vol.isPossessed && (
                                <div className="absolute bottom-2 right-2 bg-purple-600 text-white rounded-full p-1 shadow-lg">
                                    <Check className="h-4 w-4" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
