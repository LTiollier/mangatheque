"use client";

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Search, Plus, Loader2 } from 'lucide-react';
import { Manga, Series, Edition } from '@/types/manga';
import Link from 'next/link';
import { toast } from 'sonner';

import { useOffline } from '@/contexts/OfflineContext';
import { VolumeGrid } from '@/components/collection/VolumeGrid';
import { ActionToolbar } from '@/components/collection/ActionToolbar';
import { mangaService } from '@/services/manga.service';
import { motion } from 'framer-motion';

export default function SearchEditionPage() {
    const params = useParams();
    const seriesId = params.id as string;
    const editionId = params.editionId as string;
    const { isOffline } = useOffline();

    const [mangas, setMangas] = useState<Manga[]>([]);
    const [series, setSeries] = useState<Series| null>(null);
    const [edition, setEdition] = useState<Edition | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // UI State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [lastSelectedNum, setLastSelectedNum] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const editionData = await mangaService.getEdition(parseInt(editionId));
            setEdition(editionData);
            
            if (editionData.volumes) {
                setMangas(editionData.volumes);
            }

            if (editionData.series) {
                setSeries(editionData.series);
            } else {
                const seriesData = await mangaService.getSeries(parseInt(seriesId));
                setSeries(seriesData);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error("Erreur lors de la récupération des données.");
        } finally {
            setIsLoading(false);
        }
    }, [editionId, seriesId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Data Mapping
    const { ownedMap, totalTomes } = useMemo(() => {
        const map = new Map(mangas.map(m => [parseInt(m.number || '0'), m]));
        const maxNumber = mangas.length > 0 ? Math.max(...mangas.map(m => parseInt(m.number || '0'))) : 0;
        const total = Math.max(edition?.total_volumes || 0, maxNumber);
        return { ownedMap: map, totalTomes: total };
    }, [mangas, edition, series]);

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
    const toggleVolume = (vol: { isPossessed: boolean; manga: Manga | null; number: number }, isShift: boolean = false) => {
        const id = vol.isPossessed ? `o-${vol.manga?.id}` : `m-${vol.number}`;
        const isOwned = vol.isPossessed;
        
        setSelectedIds(prev => {
            // Check if we already have items of the OTHER type
            const hasOtherType = prev.length > 0 && (
                isOwned ? prev[0].startsWith('m-') : prev[0].startsWith('o-')
            );

            if (hasOtherType) {
                // Switching types: clear previous selection and select the new item
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
        const toAdd = selectedIds
            .filter(id => id.startsWith('m-'))
            .map(id => parseInt(id.replace('m-', '')));
        
        if (toAdd.length === 0) return;

        setIsSaving(true);
        try {
            await mangaService.addBulk(edition!.id, toAdd);
            toast.success(`${toAdd.length} tome(s) ajouté(s) à votre collection`);
            setSelectedIds([]);
            await fetchData();
        } catch (error) {
            toast.error("Erreur lors de l'ajout");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-slate-400 font-medium">Chargement des volumes...</p>
            </div>
        );
    }

    if (!series || !edition) return null;

    const possessedCount = mangas.filter(v => v.is_owned).length;

    return (
        <div className="space-y-8 pb-32 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
                <div className="space-y-4">
                    <Button variant="ghost" asChild className="text-muted-foreground hover:text-white group -ml-4">
                        <Link href={`/search/series/${series.id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-black uppercase tracking-widest text-[10px]">{series.title}</span>
                        </Link>
                    </Button>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-display font-black uppercase tracking-tight text-white">{edition.name}</h1>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                            <Search className="h-3 w-3" /> Mode Exploration
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl px-6 py-4 rounded-[2rem] border border-white/10 shadow-2xl">
                    <div className="flex flex-col">
                        <span className="text-3xl font-display font-black text-primary leading-none">
                            {possessedCount} / {totalTomes}
                        </span>
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Possédés</span>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-white/5 border-t-primary flex items-center justify-center">
                        <span className="text-xs font-black text-white">{Math.round((possessedCount / totalTomes) * 100)}%</span>
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
                    if (vol.isPossessed) {
                        toast.info("Vous possédez déjà ce tome !");
                        return;
                    }
                    const isShift = typeof window !== 'undefined' ? (window.event as unknown as MouseEvent)?.shiftKey || false : false;
                    toggleVolume(vol, isShift);
                }}
            />

            {selectedIds.length > 0 && selectedIds[0].startsWith('m-') && (
                <ActionToolbar
                    selectedCount={selectedIds.length}
                    hasMissing={true}
                    hasOwned={false}
                    onAdd={handleBatchAdd}
                    onLoan={() => {}} // Disabled for search
                    onRemove={() => {}} // Disabled for search
                    onCancel={() => setSelectedIds([])}
                    isSaving={isSaving}
                />
            )}
            
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed bottom-10 inset-x-0 flex justify-center pointer-events-none"
            >
                <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 shadow-2xl pointer-events-auto">
                    Sélectionnez les volumes à ajouter à votre mangathèque
                </div>
            </motion.div>
        </div>
    );
}
