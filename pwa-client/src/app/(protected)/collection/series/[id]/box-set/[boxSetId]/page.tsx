"use client";

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, Check, ChevronRight, Loader2, Plus, Trash2 } from 'lucide-react';
import { BoxSet, Series } from '@/types/manga';
import Link from 'next/link';
import { toast } from 'sonner';

import { useOffline } from '@/contexts/OfflineContext';
import { mangaService } from '@/services/manga.service';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function BoxSetPage() {
    const params = useParams();
    const seriesId = params.id as string;
    const boxSetId = params.boxSetId as string;
    const { isOffline } = useOffline();

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

    const handleToggleBox = async (boxId: number, isOwned: boolean) => {
        if (isOffline) {
            toast.error("Mode hors ligne actif. Action impossible.");
            return;
        }

        setIsSaving(boxId);
        try {
            if (isOwned) {
                await mangaService.removeBoxFromCollection(boxId);
                toast.success("Coffret retiré de la collection");
            } else {
                await mangaService.addBoxToCollection(boxId);
                toast.success("Coffret ajouté à la collection");
            }
            await fetchData();
        } catch (error) {
            console.error('Failed to toggle box:', error);
            toast.error("Une erreur est survenue.");
        } finally {
            setIsSaving(null);
        }
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
        <div className="space-y-8 pb-32">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
                <div className="space-y-2">
                    <Button variant="ghost" asChild className="text-muted-foreground hover:text-white group -ml-4">
                        <Link href={`/collection/series/${series.id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-black uppercase tracking-widest text-[10px]">{series.title}</span>
                        </Link>
                    </Button>
                    <h1 className="text-4xl font-display font-black uppercase tracking-tight">{boxSet.title}</h1>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {boxSet.boxes.map((box) => (
                    <motion.div
                        key={box.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Card className="premium-glass hover:bg-card/80 transition-all flex flex-col h-full rounded-[2rem] overflow-hidden border border-border/50 group">
                            <Link href={`/collection/series/${seriesId}/box/${box.id}`} className="flex-grow">
                                <CardHeader className="pb-3 border-b border-white/5 space-y-3">
                                    <CardTitle className="text-xl font-display font-black uppercase tracking-tight text-white group-hover:text-primary transition-colors">
                                        {box.title}
                                    </CardTitle>
                                    <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded w-fit">
                                        ISBN: {box.isbn || 'N/A'}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Contenu</p>
                                            <p className="text-xl font-display font-black text-white">
                                                {box.possessed_count} / {box.total_volumes} <span className="text-xs text-muted-foreground font-black uppercase tracking-widest ml-1">Tomes</span>
                                            </p>
                                        </div>
                                        {box.is_owned ? (
                                            <div className="bg-primary/10 text-primary p-2 rounded-xl border border-primary/20">
                                                <Check className="h-5 w-5" />
                                            </div>
                                        ) : (
                                            <div className="bg-white/5 text-muted-foreground p-2 rounded-xl border border-white/5">
                                                <Package className="h-5 w-5" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-primary" 
                                            style={{ width: `${box.total_volumes ? (box.possessed_count || 0) / box.total_volumes * 100 : 0}%` }}
                                        />
                                    </div>
                                    
                                    {box.is_owned && (
                                        <div className="text-primary font-black uppercase tracking-widest text-[9px] flex items-center gap-1">
                                            <Check className="h-3 w-3" /> Coffret en ma possession
                                        </div>
                                    )}
                                </CardContent>
                            </Link>
                            <div className="p-6 pt-0 flex gap-2">
                                <Button 
                                    asChild 
                                    variant="outline"
                                    className="flex-grow h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white border-white/10 shadow-none"
                                >
                                    <Link href={`/collection/series/${seriesId}/box/${box.id}`}>
                                        <span className="font-black uppercase tracking-widest text-[10px]">Voir</span>
                                        <ChevronRight className="h-3 w-3 ml-2" />
                                    </Link>
                                </Button>
                                {box.is_owned ? (
                                    <Button
                                        onClick={() => handleToggleBox(box.id, true)}
                                        disabled={isSaving === box.id}
                                        variant="destructive"
                                        size="icon"
                                        className="h-10 w-10 shrink-0 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 shadow-none"
                                    >
                                        {isSaving === box.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => handleToggleBox(box.id, false)}
                                        disabled={isSaving === box.id}
                                        className="flex-grow-[2] h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-none border-none"
                                    >
                                        {isSaving === box.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Plus className="h-4 w-4 mr-2" />
                                        )}
                                        <span className="font-black uppercase tracking-widest text-[10px]">Ajouter</span>
                                    </Button>
                                )}
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
