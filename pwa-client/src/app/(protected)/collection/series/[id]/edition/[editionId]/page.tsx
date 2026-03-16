"use client";

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, WifiOff } from 'lucide-react';
import { Manga, Series, Edition } from '@/types/manga';
import Link from 'next/link';
import { toast } from 'sonner';

import { useAlert } from '@/contexts/AlertContext';
import { useOffline } from '@/contexts/OfflineContext';
import { LoanDialog } from '@/components/manga/loan-dialog';
import { VolumeGrid } from '@/components/collection/VolumeGrid';
import { ActionToolbar } from '@/components/collection/ActionToolbar';
import { mangaService } from '@/services/manga.service';
import { userService } from '@/services/user.service';
import { loanService } from '@/services/loan.service';

export default function EditionPage() {
    const params = useParams();
    const router = useRouter();
    const seriesId = params.id as string;
    const editionId = params.editionId as string;
    const { confirm } = useAlert();
    const { isOffline } = useOffline();

    const [mangas, setMangas] = useState<Manga[]>([]);
    const [series, setSeries] = useState<Series| null>(null);
    const [edition, setEdition] = useState<Edition | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // UI State
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [lastSelectedNum, setLastSelectedNum] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoanDialogOpen, setIsLoanDialogOpen] = useState(false);

    const fetchMangas = useCallback(async () => {
        try {
            const editionVolumes = await userService.getEditionVolumes(editionId);
            setMangas(editionVolumes);

            const seriesData = await userService.getSeries(seriesId);
            setSeries(seriesData);

            const editions = await userService.getSeriesEditions(seriesId);
            const currentEdition = editions.find(e => e.id.toString() === editionId);
            if (currentEdition) {
                setEdition(currentEdition);
            } else if (editionVolumes.length > 0 && editionVolumes[0].edition) {
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

    // Data Mapping
    const ownedMap = new Map(mangas.map(m => [parseInt(m.number || '0'), m]));
    const maxNumber = mangas.length > 0 ? Math.max(...mangas.map(m => parseInt(m.number || '0'))) : 0;
    const totalTomes = Math.max(edition?.total_volumes || 0, series?.total_volumes || 0, maxNumber);

    const volumesUI = useMemo(() => {
        const ui = [];
        for (let i = 1; i <= totalTomes; i++) {
            const m = ownedMap.get(i);
            ui.push({
                id: m?.id,
                number: i,
                isPossessed: !!m?.is_owned,
                cover_url: m?.cover_url || series?.cover_url || null,
                manga: m || null,
            });
        }
        return ui;
    }, [totalTomes, ownedMap, series]);

    // Selection Logic
    const toggleVolume = (vol: any, isShift: boolean = false) => {
        const id = vol.isPossessed ? (vol.manga?.id ?? -vol.number) : vol.number;
        
        if (isShift && lastSelectedNum !== null) {
            const start = Math.min(lastSelectedNum, vol.number);
            const end = Math.max(lastSelectedNum, vol.number);
            const rangeIds = volumesUI
                .filter(v => v.number >= start && v.number <= end)
                .map(v => v.isPossessed ? (v.manga?.id ?? -v.number) : v.number);
            
            setSelectedIds(prev => Array.from(new Set([...prev, ...rangeIds])));
        } else {
            setSelectedIds(prev => 
                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            );
        }
        setLastSelectedNum(vol.number);
    };

    const handleBatchAdd = async () => {
        const toAdd = selectedIds.filter(id => !mangas.some(m => m.id === id));
        if (toAdd.length === 0) return;

        setIsSaving(true);
        try {
            await mangaService.addBulk(edition!.id, toAdd);
            toast.success(`${toAdd.length} tome(s) ajouté(s)`);
            setSelectedIds([]);
            await fetchMangas();
        } catch (error) {
            toast.error("Erreur lors de l'ajout");
        } finally {
            setIsSaving(false);
        }
    };

    const handleBatchRemove = () => {
        const toRemove = mangas.filter(m => selectedIds.includes(m.id));
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
                await fetchMangas();
            }
        });
    };

    const selectedMangaForLoan = mangas.filter(m => selectedIds.includes(m.id) && !m.is_loaned);

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

    if (!series || !edition) return null;

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
                    <h1 className="text-4xl font-display font-black uppercase tracking-tight">{edition.name}</h1>
                </div>
                <div className="flex items-center gap-4 bg-card/50 backdrop-blur-xl px-6 py-3 rounded-2xl border border-border/50">
                    <div className="flex flex-col">
                        <span className="text-2xl font-display font-black text-primary leading-none">
                            {mangas.length} / {totalTomes}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Tomes possédés</span>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center">
                        <span className="text-xs font-black">{Math.round((mangas.length / totalTomes) * 100)}%</span>
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
                                await fetchMangas();
                            }
                        });
                        return;
                    }
                    // Handle Shift key via window event since it's not in the toggle callback usually
                    const isShift = (window.event as any)?.shiftKey || false;
                    toggleVolume(vol, isShift);
                }}
            />

            <ActionToolbar
                selectedCount={selectedIds.length}
                hasMissing={selectedIds.some(id => !mangas.some(m => m.id === id))}
                hasOwned={selectedIds.some(id => mangas.some(m => m.id === id))}
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
                    fetchMangas();
                    setSelectedIds([]);
                }}
            />
        </div>
    );
}
