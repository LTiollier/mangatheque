"use client";

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Manga, Series, Box } from '@/types/manga';
import Link from 'next/link';
import { toast } from 'sonner';

import { useAlert } from '@/contexts/AlertContext';
import { useOffline } from '@/contexts/OfflineContext';
import { LoanDialog } from '@/components/manga/loan-dialog';
import { VolumeGrid } from '@/components/collection/VolumeGrid';
import { ActionToolbar } from '@/components/collection/ActionToolbar';
import { mangaService } from '@/services/manga.service';
import { loanService } from '@/services/loan.service';

export default function BoxPage() {
    const params = useParams();
    const seriesId = params.id as string;
    const boxId = params.boxId as string;
    const { confirm } = useAlert();
    const { isOffline } = useOffline();

    const [mangas, setMangas] = useState<Manga[]>([]);
    const [series, setSeries] = useState<Series | null>(null);
    const [box, setBox] = useState<Box | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // UI State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [lastSelectedNum, setLastSelectedNum] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoanDialogOpen, setIsLoanDialogOpen] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const boxData = await mangaService.getBox(parseInt(boxId));
            setBox(boxData);
            
            if (boxData.volumes) {
                setMangas(boxData.volumes);
            }

            // Pour l'instant on récupère la série via l'ID de l'URL
            const seriesData = await mangaService.getSeries(parseInt(seriesId));
            setSeries(seriesData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [boxId, seriesId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Data Mapping
    const { totalTomes, possessedCount } = useMemo(() => {
        const total = mangas.length;
        const possessed = mangas.filter(m => m.is_owned).length;
        return { totalTomes: total, possessedCount: possessed };
    }, [mangas]);

    const volumesUI = useMemo(() => {
        return mangas.map(m => ({
            id: m.id,
            number: parseInt(m.number || '0'),
            isPossessed: !!m.is_owned,
            cover_url: m.cover_url || series?.cover_url || null,
            manga: m,
        }));
    }, [mangas, series]);

    // Selection Logic
    const toggleVolume = (vol: { isPossessed: boolean; manga: Manga | null; number: number }, isShift: boolean = false) => {
        const id = vol.isPossessed ? `o-${vol.manga?.id}` : `m-${vol.number}`;
        const isOwned = vol.isPossessed;
        
        setSelectedIds(prev => {
            const hasOtherType = prev.length > 0 && (
                isOwned ? prev[0].startsWith('m-') : prev[0].startsWith('o-')
            );

            if (hasOtherType) {
                return [id];
            }

            if (isShift && lastSelectedNum !== null) {
                const start = Math.min(lastSelectedNum, vol.number);
                const end = Math.max(lastSelectedNum, vol.number);
                const rangeIds = volumesUI
                    .filter(v => v.number >= start && v.number <= end)
                    .filter(v => v.isPossessed === isOwned)
                    .map(v => v.isPossessed ? `o-${v.manga?.id}` : `m-${v.number}`);
                
                return Array.from(new Set([...prev, ...rangeIds]));
            } else {
                return prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
            }
        });
        setLastSelectedNum(vol.number);
    };

    const handleBatchAdd = async () => {
        if (isOffline) {
            toast.error("Mode hors ligne actif. Action impossible.");
            return;
        }

        setIsSaving(true);
        try {
            await mangaService.addBoxToCollection(parseInt(boxId));
            toast.success("Coffret et tomes ajoutés à la collection");
            await fetchData();
            setSelectedIds([]);
        } catch (error) {
            console.error('Failed to add box:', error);
            toast.error("Une erreur est survenue lors de l'ajout du coffret.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleBatchRemove = () => {
        const ownedIds = selectedIds
            .filter(id => id.startsWith('o-'))
            .map(id => parseInt(id.replace('o-', '')));
            
        const toRemove = mangas.filter(m => ownedIds.includes(m.id));
        if (toRemove.length === 0) return;

        confirm({
            title: `RETIRER ${toRemove.length} TOME(S) ?`,
            description: "Cette action supprimera ces tomes de votre collection.",
            confirmLabel: "RETIRER",
            destructive: true,
            onConfirm: async () => {
                await Promise.all(toRemove.map(m => mangaService.removeVolume(m.id)));
                toast.success("Tomes retirés");
                setSelectedIds([]);
                await fetchData();
            }
        });
    };

    const selectedMangaForLoan = mangas.filter(m => 
        selectedIds.includes(`o-${m.id}`) && !m.is_loaned
    );

    if (isLoading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-8 w-48 bg-slate-800 rounded-full"></div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="aspect-[2/3] bg-slate-800 rounded-2xl"></div>)}
                </div>
            </div>
        );
    }

    if (!series || !box) return null;

    return (
        <div className="space-y-8 pb-32">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
                <div className="space-y-2">
                    <Button variant="ghost" asChild className="text-muted-foreground hover:text-white group -ml-4">
                        <Link href={`/collection/series/${series.id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-black uppercase tracking-widest text-[10px]">{series.title}</span>
                        </Link>
                    </Button>
                    <h1 className="text-4xl font-display font-black uppercase tracking-tight">{box.title}</h1>
                </div>
                <div className="flex items-center gap-4 bg-card/50 backdrop-blur-xl px-6 py-3 rounded-2xl border border-border/50">
                    <div className="flex flex-col">
                        <span className="text-2xl font-display font-black text-primary leading-none">
                            {possessedCount} / {totalTomes}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Tomes possédés</span>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center">
                        <span className="text-xs font-black">{Math.round((possessedCount / totalTomes) * 100)}%</span>
                    </div>
                </div>
            </div>

            <VolumeGrid
                volumesUI={volumesUI}
                selectedIds={selectedIds}
                onVolumeToggle={(vol) => {
                    if (isOffline) {
                        toast.error("Mode hors ligne actif");
                        return;
                    }
                    if (vol.manga?.is_loaned) {
                        confirm({
                            title: "MARQUER COMME RENDU ?",
                            description: `Le tome ${vol.number} a-t-il été récupéré ?`,
                            confirmLabel: "OUI, RÉCUPÉRÉ",
                            onConfirm: async () => {
                                await loanService.markReturned(vol.manga!.id);
                                await fetchData();
                            }
                        });
                        return;
                    }
                    const isShift = typeof window !== 'undefined' ? (window.event as unknown as MouseEvent)?.shiftKey || false : false;
                    toggleVolume(vol, isShift);
                }}
            />

            <ActionToolbar
                selectedCount={selectedIds.length}
                hasMissing={selectedIds.length > 0 && selectedIds[0].startsWith('m-')}
                hasOwned={selectedIds.length > 0 && selectedIds[0].startsWith('o-')}
                onAdd={handleBatchAdd}
                onLoan={() => {
                    if (selectedMangaForLoan.length === 0) {
                        toast.error("Aucun tome disponible pour le prêt");
                        return;
                    }
                    setIsLoanDialogOpen(true);
                }}
                onRemove={handleBatchRemove}
                onCancel={() => setSelectedIds([])}
                isSaving={isSaving}
            />

            <LoanDialog
                mangas={selectedMangaForLoan}
                open={isLoanDialogOpen}
                onOpenChange={setIsLoanDialogOpen}
                onSuccess={() => {
                    fetchData();
                    setSelectedIds([]);
                }}
            />
        </div>
    );
}
