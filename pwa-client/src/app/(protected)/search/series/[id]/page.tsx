"use client";

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, BookOpen, Package, Plus } from 'lucide-react';
import { Manga, Series, Edition } from '@/types/manga';
import Link from 'next/link';
import { EditionList } from '@/components/collection/EditionList';
import { MangaCover } from '@/components/ui/manga-cover';
import { mangaService } from '@/services/manga.service';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function SearchSeriesPage() {
    const params = useParams();
    const router = useRouter();
    const seriesId = parseInt(params.id as string);

    const [series, setSeries] = useState<Series | null>(null);
    const [volumes, setVolumes] = useState<Manga[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingAll, setIsAddingAll] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const seriesData = await mangaService.getSeries(seriesId);
            setSeries(seriesData);

            if (seriesData.editions) {
                const allVolumesMap = new Map<number, Manga>();
                
                // Fetch volumes for all editions in parallel for speed
                const volumesPromises = seriesData.editions.map(edition => 
                    mangaService.getEditionVolumes(edition.id)
                );
                
                const results = await Promise.all(volumesPromises);
                
                results.forEach(editionVolumes => {
                    editionVolumes.forEach(v => allVolumesMap.set(v.id, v));
                });
                
                setVolumes(Array.from(allVolumesMap.values()));
            }
        } catch (error) {
            console.error('Failed to fetch series data:', error);
            toast.error("Erreur lors de la récupération des détails.");
        } finally {
            setIsLoading(false);
        }
    }, [seriesId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const editionsList = useMemo(() => {
        if (!series || !series.editions) return [];
        
        return series.editions.map(edition => ({
            edition: edition,
            volumes: volumes.filter(v => v.edition?.id === edition.id)
        }));
    }, [series, volumes]);

    const handleAddAll = async (edition: Edition, totalVolumes: number, possessedNumbers: Set<number>) => {
        if (totalVolumes <= 0) return;

        const missing = [];
        for (let i = 1; i <= totalVolumes; i++) {
            if (!possessedNumbers.has(i)) {
                missing.push(i);
            }
        }

        if (missing.length === 0) {
           toast.info("Vous possédez déjà tous les tomes de cette édition !");
           return;
        }

        setIsAddingAll(edition.id);
        try {
            await mangaService.addBulk(edition.id, missing);
            toast.success(`Ajout de ${missing.length} tomes réussi !`);
            await fetchData();
        } catch (error) {
            console.error('Failed to add all volumes', error);
            toast.error("Échec de l'ajout des tomes.");
        } finally {
            setIsAddingAll(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in fade-in duration-700">
                <div className="relative">
                    <div className="h-20 w-20 rounded-full border-t-2 border-primary animate-spin" />
                    <BookOpen className="h-8 w-8 text-primary absolute inset-0 m-auto animate-pulse" />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Extraction des données du manga...</p>
            </div>
        );
    }

    if (!series) {
        return (
            <div className="space-y-8">
                <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground hover:text-white group">
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> RETOUR
                </Button>
                <div className="premium-glass p-20 text-center rounded-[3rem] border-dashed border-2">
                    <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xl">
                        Série introuvable
                    </p>
                </div>
            </div>
        );
    }

    const possessedTotal = volumes.filter(v => v.is_owned).length;

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-white group -ml-2">
                <Link href="/search">
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
                    <span className="font-black uppercase tracking-widest text-xs">Retour à la recherche</span>
                </Link>
            </Button>

            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 border border-white/5 shadow-2xl group/hero">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
                    {series.cover_url && (
                        <Image src={series.cover_url} alt="" fill className="object-cover blur-3xl scale-110 saturate-150" />
                    )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(var(--color-primary-rgb),0.15),transparent)]" />

                <div className="relative flex flex-col md:flex-row gap-8 lg:gap-16 p-8 md:p-12 items-center md:items-start text-center md:text-left">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 0.6 }}
                        className="relative w-64 h-96 flex-shrink-0 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 before:absolute before:inset-0 before:z-20 before:shadow-[inset_0_0_100px_rgba(0,0,0,0.2)]"
                    >
                        <MangaCover 
                            src={series.cover_url} 
                            alt={series.title} 
                            title={series.title}
                            priority 
                            className="transition-transform duration-700 group-hover/hero:scale-105"
                        />
                    </motion.div>
 
                    <div className="flex-1 space-y-8 pt-4 relative z-10">
                        <div className="space-y-4">

                            <motion.h1 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-5xl md:text-7xl font-display font-black leading-[0.9] uppercase tracking-tighter text-white drop-shadow-sm"
                            >
                                {series.title}
                            </motion.h1>
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex items-center justify-center md:justify-start gap-2 text-primary font-black uppercase tracking-[0.2em] text-sm"
                            >
                                <User className="h-4 w-4" />
                                {series.authors ? series.authors.join(', ') : 'Auteurs inconnus'}
                            </motion.div>
                        </div>


                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-wrap gap-4 justify-center md:justify-start pt-4"
                        >
                            <div className="flex flex-col px-6 py-3 bg-white/5 rounded-[1.5rem] border border-white/10 backdrop-blur-md">
                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Total Possédés</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-display font-black text-white">{possessedTotal}</span>
                                    <span className="text-slate-600 font-black text-xs">/ {volumes.length} tomes</span>
                                </div>
                            </div>

                            <div className="flex flex-col px-6 py-3 bg-white/5 rounded-[1.5rem] border border-white/10 backdrop-blur-md">
                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Éditions</span>
                                <span className="text-3xl font-display font-black text-primary">{series.editions?.length || 0}</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Editions Section */}
            <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h2 className="text-3xl font-display font-black flex items-center gap-3 uppercase tracking-tight text-white">
                        <BookOpen className="h-8 w-8 text-primary" />
                        Éditions disponibles
                    </h2>
                </div>

                <EditionList
                    series={series}
                    editionsList={editionsList}
                    baseUrl={`/search/series/${seriesId}`}
                    isAddingAll={isAddingAll}
                    onAddAll={(edition, total, numbers) => handleAddAll(edition, total, numbers)}
                />
            </div>

            {/* Box Sets Section */}
            {series.box_sets && series.box_sets.length > 0 && (
                <div className="space-y-8">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <Package className="h-8 w-8 text-primary" />
                        <h2 className="text-3xl font-display font-black uppercase tracking-tight text-white">
                            Coffrets & Intégrales
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {series.box_sets.map(boxSet => (
                            <div key={boxSet.id} className="premium-glass p-6 rounded-[2rem] border border-white/5 space-y-6 group/box">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-display font-black text-white uppercase group-hover/box:text-primary transition-colors">
                                        {boxSet.title}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                        {boxSet.publisher}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {boxSet.boxes.map(box => (
                                        <div key={box.id} className="flex gap-4 p-3 bg-white/[0.02] rounded-2xl border border-white/5 items-center">
                                            <div className="relative w-12 h-18 rounded-lg overflow-hidden flex-shrink-0">
                                                <MangaCover src={box.cover_url} alt={box.title} title={box.title} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white truncate uppercase">{box.title}</p>
                                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">
                                                    ISBN: {box.isbn || 'N/A'}
                                                </p>
                                            </div>
                                            {box.is_empty ? (
                                                <div className="px-2 py-1 rounded-md bg-white/5 text-[8px] font-black uppercase text-slate-500">Vide</div>
                                            ) : (
                                                <div className="px-2 py-1 rounded-md bg-primary/10 text-[8px] font-black uppercase text-primary">Complet</div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <Button className="w-full rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10" disabled>
                                    <Plus className="h-4 w-4 mr-2" />
                                    <span className="font-black uppercase tracking-widest text-[11px]">Bientôt disponible</span>
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
