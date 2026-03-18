"use client";

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, Check, Loader2, Plus, Search } from 'lucide-react';
import { BoxSet, Series, Box } from '@/types/manga';
import Link from 'next/link';
import { toast } from 'sonner';

import { useOffline } from '@/contexts/OfflineContext';
import { useAlert } from '@/contexts/AlertContext';
import { mangaService } from '@/services/manga.service';
import { motion } from 'framer-motion';
import { Card, CardTitle } from '@/components/ui/card';
import { MangaCover } from '@/components/ui/manga-cover';

export default function SearchBoxSetPage() {
    const params = useParams();
    const seriesId = params.id as string;
    const boxSetId = params.boxSetId as string;
    const { isOffline } = useOffline();
    const { confirm } = useAlert();

    const [boxSet, setBoxSet] = useState<BoxSet | null>(null);
    const [series, setSeries] = useState<Series | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const data = await mangaService.getBoxSet(parseInt(boxSetId));
            setBoxSet(data);

            const seriesData = await mangaService.getSeries(parseInt(seriesId));
            setSeries(seriesData);
        } catch (error) {
            console.error('Failed to fetch box set data:', error);
            toast.error("Erreur lors de la récupération du coffret.");
        } finally {
            setIsLoading(false);
        }
    }, [boxSetId, seriesId]);

    const performAddBox = async (boxId: number, includeVolumes: boolean) => {
        setIsSaving(boxId);
        try {
            await mangaService.addBoxToCollection(boxId, includeVolumes);
            toast.success("Coffret ajouté à la collection");
            await fetchData();
        } catch (error) {
            console.error('Failed to add box:', error);
            toast.error("Une erreur est survenue.");
        } finally {
            setIsSaving(null);
        }
    };

    const handleAddBox = async (box: Box) => {
        if (isOffline) {
            toast.error("Mode hors ligne actif. Action impossible.");
            return;
        }

        confirm({
            title: "Ajouter les tomes ?",
            description: "Voulez-vous également ajouter tous les tomes contenus dans ce coffret à votre collection ?",
            confirmLabel: "Oui, tout ajouter",
            cancelLabel: "Non, juste le coffret",
            onConfirm: () => performAddBox(box.id, true),
            onCancel: () => performAddBox(box.id, false),
        });
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const stats = useMemo(() => {
        if (!boxSet) return { total: 0, possessed: 0 };
        const total = boxSet.boxes.length;
        const possessed = boxSet.boxes.filter(b => b.is_owned).length;
        return { total, possessed };
    }, [boxSet]);

    if (isLoading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-8 w-48 bg-slate-800 rounded-full"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-800 rounded-[2rem]"></div>)}
                </div>
            </div>
        );
    }

    if (!series || !boxSet) return null;

    return (
        <div className="space-y-8 pb-32 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
                <div className="space-y-2">
                    <Button variant="ghost" asChild className="text-muted-foreground hover:text-white group -ml-4">
                        <Link href={`/search/series/${series.id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-black uppercase tracking-widest text-[10px]">{series.title}</span>
                        </Link>
                    </Button>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-display font-black uppercase tracking-tight">{boxSet.title}</h1>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                            <Search className="h-3 w-3" /> Mode Exploration
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-card/50 backdrop-blur-xl px-6 py-3 rounded-2xl border border-border/50">
                    <div className="flex flex-col">
                        <span className="text-2xl font-display font-black text-primary leading-none">
                            {stats.possessed} / {stats.total}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Coffrets possédés</span>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center">
                        <span className="text-xs font-black">{stats.total > 0 ? Math.round((stats.possessed / stats.total) * 100) : 0}%</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {boxSet.boxes.map((box) => (
                    <motion.div
                        key={box.id}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Card className="premium-glass hover:bg-card/80 transition-all rounded-[1.5rem] overflow-hidden border border-border/50 group flex flex-row min-h-[10rem] md:min-h-[12rem]">
                            <div className="relative w-28 md:w-32 flex-shrink-0 min-h-[10rem] md:min-h-[12rem] aspect-[2/3] overflow-hidden border-r border-white/5">
                                <MangaCover
                                    src={box.cover_url || series.cover_url}
                                    alt={box.title}
                                    title={box.title}
                                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                                />
                                {box.is_owned && (
                                    <div className="absolute top-3 left-3 bg-primary text-primary-foreground p-1.5 rounded-full shadow-2xl z-10">
                                        <Check className="h-3.5 w-3.5" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col p-5 md:p-8 justify-between">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-2xl md:text-3xl font-display font-black uppercase tracking-tight text-white line-clamp-1 leading-none">
                                                {box.title}
                                            </CardTitle>
                                            <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                                                <Package className="h-3 w-3 text-primary" />
                                                Contenu: {box.total_volumes} {box.total_volumes && box.total_volumes > 1 ? 'Tomes' : 'Tome'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-4">
                                    {!box.is_owned && (
                                        <Button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleAddBox(box);
                                            }}
                                            disabled={isSaving === box.id || isOffline}
                                            variant="ghost"
                                            className="h-10 px-4 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border border-primary/20"
                                        >
                                            {isSaving === box.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Plus className="h-4 w-4 mr-2" />
                                            )}
                                            <span className="font-black uppercase tracking-widest text-[10px]">Ajouter</span>
                                        </Button>
                                    )}
                                    {box.is_owned && (
                                        <div className="flex items-center gap-1.5 text-primary font-black uppercase tracking-widest text-[9px]">
                                            <Check className="h-3.5 w-3.5" /> Coffret possédé
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed bottom-10 inset-x-0 flex justify-center pointer-events-none"
            >
                <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 shadow-2xl pointer-events-auto">
                    Sélectionnez les coffrets à ajouter à votre mangathèque
                </div>
            </motion.div>
        </div>
    );
}
