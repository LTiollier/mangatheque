"use client";

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowLeftRight, Check, CheckCircle2, Circle, Loader2, WifiOff } from 'lucide-react';
import api from '@/lib/api';
import { Manga, Series, Edition } from '@/types/manga';
import Link from 'next/link';
import { toast } from 'sonner';

import { useAlert } from '@/contexts/AlertContext';
import { useOffline } from '@/contexts/OfflineContext';
import { LoanDialog } from '@/components/manga/loan-dialog';

export default function EditionPage() {
    const params = useParams();
    const router = useRouter();
    const seriesId = params.id as string;
    const editionId = params.editionId as string;
    const { confirm } = useAlert();
    const { isOffline } = useOffline();

    const [mangas, setMangas] = useState<Manga[]>([]);
    const [series, setSeries] = useState<Series | null>(null);
    const [edition, setEdition] = useState<Edition | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMissing, setSelectedMissing] = useState<number[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const [isLoanDialogOpen, setIsLoanDialogOpen] = useState(false);
    const [selectedMangaForLoan, setSelectedMangaForLoan] = useState<Manga[]>([]);
    const [isLoanMode, setIsLoanMode] = useState(false);

    const fetchMangas = useCallback(async () => {
        try {
            // Get volumes for this specific edition
            const volumesResponse = await api.get(`/editions/${editionId}/volumes`);
            const editionVolumes: Manga[] = volumesResponse.data.data;
            setMangas(editionVolumes);

            // Get series info
            const seriesResponse = await api.get(`/series/${seriesId}`);
            setSeries(seriesResponse.data.data);

            // Set edition info (from the first volume or series fetch if needed)
            if (editionVolumes.length > 0 && editionVolumes[0].edition) {
                setEdition(editionVolumes[0].edition);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [editionId, seriesId]);

    useEffect(() => {
        fetchMangas();
    }, [fetchMangas]);

    if (isLoading) {
        return <div className="animate-pulse space-y-8 p-8">
            <div className="h-10 w-48 bg-slate-800 rounded"></div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="aspect-[2/3] bg-slate-800 rounded-xl"></div>)}
            </div>
        </div>;
    }

    if (!series || !edition) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                </Button>
                <div className="p-8 text-center text-slate-500">
                    Série ou Édition introuvable.
                </div>
            </div>
        );
    }

    // Identify which volumes are in collection
    const possessedNumbers = new Set(
        mangas
            .filter(m => m.is_owned)
            .map(m => parseInt(m.number || '0'))
            .filter(n => !isNaN(n) && n > 0)
    );

    const maxPossessed = possessedNumbers.size > 0 ? Math.max(...Array.from(possessedNumbers)) : 0;
    const totalTomes = Math.max(edition.total_volumes || 0, series.total_volumes || 0, maxPossessed + 5);

    const volumesUI = [];
    for (let i = 1; i <= totalTomes; i++) {
        const possessedManga = mangas.find(m => parseInt(m.number || '0') === i);
        const isPossessed = possessedManga?.is_owned || false;

        volumesUI.push({
            id: possessedManga?.id,
            number: i,
            isPossessed,
            cover_url: possessedManga?.cover_url || series.cover_url || null,
            manga: possessedManga || null,
        });
    }

    const toggleSelection = (num: number) => {
        if (selectedMissing.includes(num)) {
            setSelectedMissing(selectedMissing.filter(n => n !== num));
        } else {
            setSelectedMissing([...selectedMissing, num]);
        }
    };

    const handleRemoveVolume = (volumeId: number, num: number) => {
        confirm({
            title: `Retirer le tome ${num} ?`,
            description: `Êtes-vous sûr de vouloir retirer le tome ${num} de votre collection ?`,
            confirmLabel: "Retirer",
            destructive: true,
            onConfirm: async () => {
                await api.delete(`/mangas/${volumeId}`);
                await fetchMangas();
            }
        })
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

                {selectedMissing.length > 0 && !isLoanMode && (
                    <div className="flex items-center gap-2 bg-purple-900/40 p-2 rounded-xl border border-purple-500/30">
                        <span className="px-3 text-purple-200 font-medium text-sm">
                            {selectedMissing.length} tome(s) sélectionné(s)
                        </span>
                        <Button
                            className={isOffline ? "bg-slate-800 text-slate-500" : "bg-purple-600 hover:bg-purple-500 font-bold"}
                            onClick={handleBulkAdd}
                            disabled={isSaving || isOffline}
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : isOffline ? <WifiOff className="h-4 w-4 mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                            {isOffline ? "Hors ligne" : "Ajouter les tomes"}
                        </Button>
                    </div>
                )}

                {selectedMangaForLoan.length > 0 && isLoanMode && (
                    <div className="flex items-center gap-2 bg-blue-900/40 p-2 rounded-xl border border-blue-500/30">
                        <span className="px-3 text-blue-200 font-medium text-sm">
                            {selectedMangaForLoan.length} tome(s) à prêter
                        </span>
                        <Button
                            className={isOffline ? "bg-slate-800 text-slate-500" : "bg-blue-600 hover:bg-blue-500 font-bold"}
                            onClick={() => setIsLoanDialogOpen(true)}
                            disabled={isOffline}
                        >
                            {isOffline ? <WifiOff className="h-4 w-4 mr-2" /> : <ArrowLeftRight className="h-4 w-4 mr-2" />}
                            {isOffline ? "Hors ligne" : "Prêter"}
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <Button
                    variant={isLoanMode ? "ghost" : "outline"}
                    size="sm"
                    onClick={() => {
                        setIsLoanMode(false);
                        setSelectedMangaForLoan([]);
                        selectAllMissing();
                    }}
                    className={!isLoanMode ? "border-slate-700 bg-slate-900 text-slate-300" : "text-slate-400 hover:text-white"}
                    disabled={isOffline}
                >
                    {isOffline && <WifiOff className="mr-2 h-4 w-4" />}
                    Sélectionner trous manquants
                </Button>
                <Button
                    variant={isLoanMode ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => {
                        setIsLoanMode(true);
                        setSelectedMissing([]);
                    }}
                    className={isLoanMode ? "border-blue-700 bg-blue-900/30 text-blue-300" : "text-slate-400 hover:text-white"}
                    disabled={isOffline}
                >
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    Multi-sélection de prêt
                </Button>
                {(selectedMissing.length > 0 || isLoanMode) && (
                    <Button variant="ghost" size="sm" onClick={() => {
                        setSelectedMissing([]);
                        setSelectedMangaForLoan([]);
                        setIsLoanMode(false);
                    }} className="text-slate-400 hover:text-white">
                        Annuler
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {volumesUI.map((vol) => {
                    const isSelected = selectedMissing.includes(vol.number);
                    const isLoanSelected = selectedMangaForLoan.some(m => m.id === vol.manga?.id);

                    return (
                        <div
                            key={vol.number}
                            onClick={() => {
                                if (isOffline) {
                                    toast.error("Connexion requise", {
                                        description: "Vous ne pouvez pas modifier votre collection en étant hors ligne.",
                                        icon: <WifiOff className="h-4 w-4" />
                                    });
                                    return;
                                }
                                if (!vol.isPossessed) {
                                    if (isLoanMode) setIsLoanMode(false);
                                    toggleSelection(vol.number);
                                } else if (isLoanMode && !vol.manga?.is_loaned && vol.manga) {
                                    if (isLoanSelected) {
                                        setSelectedMangaForLoan(selectedMangaForLoan.filter(m => m.id !== vol.manga!.id));
                                    } else {
                                        setSelectedMangaForLoan([...selectedMangaForLoan, vol.manga]);
                                    }
                                } else if (vol.manga?.is_loaned) {
                                    confirm({
                                        title: "Manga rendu ?",
                                        description: `Voulez-vous marquer "${vol.manga.title}" comme récupéré de ${vol.manga.loaned_to} ?`,
                                        confirmLabel: "Marquer comme rendu",
                                        onConfirm: async () => {
                                            await api.post("/loans/return", { volume_id: vol.manga?.id });
                                            await fetchMangas();
                                        }
                                    });
                                } else if (vol.id) {
                                    handleRemoveVolume(vol.id, vol.number);
                                }
                            }}
                            className={`
                                relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300
                                ${vol.isPossessed ? (isLoanSelected ? 'ring-4 ring-blue-500 scale-95' : 'ring-2 ring-purple-500 border-none') : 'hover:scale-105'}
                                ${isSelected && !vol.isPossessed ? 'ring-4 ring-blue-500 scale-95' : ''}
                                ${!vol.isPossessed && !isSelected ? 'opacity-50 grayscale hover:grayscale-0 hover:opacity-80 border-2 border-dashed border-slate-600' : ''}
                            `}
                        >
                            {vol.cover_url ? (
                                <Image src={vol.cover_url} alt={`Volume ${vol.number}`} fill className="object-cover" unoptimized />
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

                            {vol.isPossessed && !vol.manga?.is_loaned && (
                                <div
                                    className={`absolute bottom-2 left-2 ${isLoanSelected ? 'bg-blue-600 text-white' : 'bg-slate-900/90 text-purple-400'} rounded-full p-2 shadow-lg hover:bg-blue-600 hover:text-white transition-colors cursor-pointer border ${isLoanSelected ? 'border-blue-500' : 'border-purple-500/20'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (vol.manga) {
                                            if (isLoanMode) {
                                                if (isLoanSelected) {
                                                    setSelectedMangaForLoan(selectedMangaForLoan.filter(m => m.id !== vol.manga!.id));
                                                } else {
                                                    setSelectedMangaForLoan([...selectedMangaForLoan, vol.manga]);
                                                }
                                            } else {
                                                setSelectedMangaForLoan([vol.manga]);
                                                setIsLoanDialogOpen(true);
                                            }
                                        }
                                    }}
                                >
                                    <ArrowLeftRight className="h-4 w-4" />
                                </div>
                            )}

                            {vol.isPossessed && (
                                <div className={`absolute bottom-2 right-2 ${vol.manga?.is_loaned ? 'bg-orange-500' : 'bg-purple-600'} text-white rounded-full p-1 shadow-lg`}>
                                    {vol.manga?.is_loaned ? <ArrowLeftRight className="h-4 w-4" /> : isLoanSelected ? <CheckCircle2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                </div>
                            )}

                            {vol.manga?.is_loaned && (
                                <div className="absolute inset-0 bg-orange-500/10 backdrop-blur-[1px] flex items-center justify-center">
                                    <div className="bg-orange-500 text-white px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter shadow-xl">
                                        Prêté à {vol.manga.loaned_to}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <LoanDialog
                mangas={selectedMangaForLoan}
                open={isLoanDialogOpen}
                onOpenChange={(v) => {
                    setIsLoanDialogOpen(v);
                    if (!v && !isLoanMode) {
                        setSelectedMangaForLoan([]);
                    }
                    if (!v && isLoanMode) {
                        setIsLoanMode(false);
                        setSelectedMangaForLoan([]);
                    }
                }}
                onSuccess={() => {
                    fetchMangas();
                    setIsLoanMode(false);
                    setSelectedMangaForLoan([]);
                }}
            />
        </div>
    );
}
