"use client";

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Library, Plus, Check, Loader2, Trash2, WifiOff, ArrowLeftRight } from 'lucide-react';
import api from '@/lib/api';
import { Manga, Series, Edition } from '@/types/manga';
import Link from 'next/link';
import { useAlert } from '@/contexts/AlertContext';
import { useOffline } from '@/contexts/OfflineContext';
import { LoanDialog } from '@/components/manga/loan-dialog';

export default function SeriesPage() {
    const params = useParams();
    const router = useRouter();
    const seriesId = params.id as string;
    const { confirm } = useAlert();
    const { isOffline } = useOffline();

    const [mangas, setMangas] = useState<Manga[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingAll, setIsAddingAll] = useState<number | null>(null);
    const [isLoanDialogOpen, setIsLoanDialogOpen] = useState(false);
    const [selectedMangaForLoan, setSelectedMangaForLoan] = useState<Manga[]>([]);

    const fetchMangas = useCallback(async () => {
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
    }, [seriesId]);

    useEffect(() => {
        fetchMangas();
    }, [fetchMangas]);

    const handleAddAll = async (e: React.MouseEvent, edition: Edition, totalVolumes: number, possessedNumbers: Set<number>) => {
        e.preventDefault();
        e.stopPropagation();

        if (totalVolumes <= 0) return;

        const missing = [];
        for (let i = 1; i <= totalVolumes; i++) {
            if (!possessedNumbers.has(i)) {
                missing.push(i);
            }
        }

        if (missing.length === 0) return;

        setIsAddingAll(edition.id);
        try {
            await api.post('/mangas/bulk', {
                edition_id: edition.id,
                numbers: missing,
            });
            await fetchMangas();
        } catch (error) {
            console.error('Failed to add all volumes', error);
        } finally {
            setIsAddingAll(null);
        }
    };

    const handleRemoveSeries = () => {
        confirm({
            title: "Retirer la série ?",
            description: "Êtes-vous sûr de vouloir retirer TOUS les tomes de cette série de votre collection ? Cette action est irréversible.",
            confirmLabel: "Retirer tout",
            destructive: true,
            onConfirm: async () => {
                await api.delete(`/series/${seriesId}`);
                router.push('/collection');
            }
        });
    };

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
                    Série introuvable ou vous n&apos;avez plus de mangas de cette série.
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
                <div className="relative w-48 h-72 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl bg-slate-800 border-2 border-slate-700">
                    {series.cover_url ? (
                        <Image src={series.cover_url} alt={series.title} fill className="object-cover" unoptimized />
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
                    <div className="pt-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleRemoveSeries}
                            disabled={isOffline}
                            className={isOffline ? "bg-slate-800 text-slate-500 border-slate-700" : "bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white border border-red-900/50"}
                        >
                            {isOffline ? <WifiOff className="mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            {isOffline ? "Indisponible hors ligne" : "Retirer la série"}
                        </Button>
                    </div>
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
                        const hasTotal = Boolean(total && total > 0);
                        const possessedCount = volumes.length;
                        const percentage = hasTotal && total ? Math.min(100, (possessedCount / total) * 100) : null;
                        const possessedNumbers = new Set(volumes.map(v => parseInt(v.number || '0')).filter(n => !isNaN(n)));
                        const isComplete = hasTotal && possessedCount >= (total || 0);

                        return (
                            <Card key={edition.id} className="bg-slate-900 border-slate-800 hover:border-purple-500/50 transition-all flex flex-col">
                                <Link href={`/collection/series/${series.id}/edition/${edition.id}`} className="flex-grow">
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
                                    </CardContent>
                                </Link>
                                <div className="p-4 pt-0 space-y-2">
                                    <Button asChild className="w-full bg-slate-800 hover:bg-slate-700 text-purple-400">
                                        <Link href={`/collection/series/${series.id}/edition/${edition.id}`}>
                                            <BookOpen className="mr-2 h-4 w-4" /> Voir les tomes
                                        </Link>
                                    </Button>

                                    {hasTotal && !isComplete && (
                                        <Button
                                            variant="outline"
                                            className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                                            onClick={(e) => handleAddAll(e, edition, total || 0, possessedNumbers)}
                                            disabled={isAddingAll === edition.id || isOffline}
                                        >
                                            {isAddingAll === edition.id ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : isOffline ? (
                                                <WifiOff className="h-4 w-4 mr-2" />
                                            ) : (
                                                <Plus className="h-4 w-4 mr-2" />
                                            )}
                                            {isOffline ? "Hors ligne" : `Tout ajouter (${(total || 0) - possessedCount})`}
                                        </Button>
                                    )}

                                    {volumes.length > 0 && volumes.some(v => !v.is_loaned) && (
                                        <Button
                                            variant="outline"
                                            className="w-full border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const unloaned = volumes.filter(v => !v.is_loaned);
                                                setSelectedMangaForLoan(unloaned);
                                                setIsLoanDialogOpen(true);
                                            }}
                                            disabled={isOffline}
                                        >
                                            <ArrowLeftRight className="mr-2 h-4 w-4" />
                                            Prêter l&apos;édition ({volumes.filter(v => !v.is_loaned).length})
                                        </Button>
                                    )}

                                    {isComplete && (
                                        <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-bold py-2 bg-green-500/10 rounded-lg">
                                            <Check className="h-4 w-4" /> Collection complète
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

            <LoanDialog
                mangas={selectedMangaForLoan}
                open={isLoanDialogOpen}
                onOpenChange={setIsLoanDialogOpen}
                onSuccess={() => {
                    fetchMangas();
                    setSelectedMangaForLoan([]);
                }}
            />
        </div>
    );
}
