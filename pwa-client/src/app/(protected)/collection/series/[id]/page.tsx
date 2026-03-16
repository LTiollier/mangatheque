"use client";

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Library, Trash2, WifiOff, User, BookOpen } from 'lucide-react';
import { Manga, Series, Edition } from '@/types/manga';
import Link from 'next/link';
import { useAlert } from '@/contexts/AlertContext';
import { useOffline } from '@/contexts/OfflineContext';
import { LoanDialog } from '@/components/manga/loan-dialog';
import { EditionList } from '@/components/collection/EditionList';
import { mangaService } from '@/services/manga.service';
import { userService } from '@/services/user.service';
import { motion } from 'framer-motion';

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

    const seriesMangas = useMemo(() =>
        mangas.filter(m => m.series?.id.toString() === seriesId),
        [mangas, seriesId]);

    const editionsList = useMemo(() => {
        const editionsMap = new Map<number, { edition: Edition, volumes: Manga[] }>();
        seriesMangas.forEach(manga => {
            if (manga.edition) {
                if (!editionsMap.has(manga.edition.id)) {
                    editionsMap.set(manga.edition.id, { edition: manga.edition, volumes: [] });
                }
                editionsMap.get(manga.edition.id)!.volumes.push(manga);
            }
        });
        return Array.from(editionsMap.values());
    }, [seriesMangas]);

    const fetchMangas = useCallback(async () => {
        try {
            await mangaService.getCollection().then(setMangas);
        } catch (error) {
            console.error('Failed to fetch mangas:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

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
            await mangaService.addBulk(edition.id, missing);
            await fetchMangas();
        } catch (error) {
            console.error('Failed to add all volumes', error);
        } finally {
            setIsAddingAll(null);
        }
    };

    const handleRemoveSeries = () => {
        confirm({
            title: "RETIRER LA SÉRIE ?",
            description: "Êtes-vous sûr de vouloir retirer TOUS les tomes de cette série de votre collection ?",
            confirmLabel: "RETIRER TOUT",
            destructive: true,
            onConfirm: async () => {
                await userService.removeSeries(seriesId);
                router.push('/collection');
            }
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-8 w-32 bg-slate-800 rounded-full"></div>
                <div className="flex gap-8">
                    <div className="w-48 h-72 bg-slate-800 rounded-2xl"></div>
                    <div className="flex-1 space-y-4">
                        <div className="h-12 w-3/4 bg-slate-800 rounded"></div>
                        <div className="h-6 w-1/4 bg-slate-800 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (mangas.length === 0) {
        return (
            <div className="space-y-8">
                <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground hover:text-white">
                    <ArrowLeft className="mr-2 h-4 w-4" /> RETOUR
                </Button>
                <div className="premium-glass p-12 text-center rounded-3xl">
                    <p className="text-muted-foreground font-black uppercase tracking-widest">
                        Série introuvable ou collection vide pour cette série.
                    </p>
                </div>
            </div>
        );
    }

    const series = mangas[0]?.series as Series;

    return (
        <div className="space-y-12">
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-white group -ml-2">
                <Link href="/collection">
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
                    <span className="font-black uppercase tracking-widest text-xs">Retour à la collection</span>
                </Link>
            </Button>

            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-card border border-border/50 shadow-2xl">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                    {series.cover_url && (
                        <Image src={series.cover_url} alt="" fill className="object-cover blur-3xl scale-150" />
                    )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-card via-card to-transparent" />

                <div className="relative flex flex-col md:flex-row gap-8 lg:gap-12 p-8 md:p-12 items-center md:items-start text-center md:text-left">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-56 h-80 flex-shrink-0 rounded-2xl overflow-hidden manga-panel shadow-2xl z-10"
                    >
                        {series.cover_url ? (
                            <Image src={series.cover_url} alt={series.title} fill className="object-cover" priority />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground font-black uppercase text-xs p-4 text-center">Pas de couverture</div>
                        )}
                    </motion.div>

                    <div className="flex-1 space-y-6 pt-4 relative z-10">
                        <div className="space-y-2">
                            <motion.h1 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-5xl md:text-7xl font-display font-black leading-none uppercase tracking-tight"
                            >
                                {series.title}
                            </motion.h1>
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex items-center justify-center md:justify-start gap-2 text-primary font-black uppercase tracking-widest text-sm"
                            >
                                <User className="h-4 w-4" />
                                {series.authors ? series.authors.join(', ') : 'Auteurs inconnus'}
                            </motion.div>
                        </div>

                        {series.description && (
                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-muted-foreground text-sm lg:text-base leading-relaxed max-w-2xl line-clamp-4 font-medium"
                            >
                                {series.description}
                            </motion.p>
                        )}

                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-wrap gap-4 justify-center md:justify-start pt-2"
                        >
                            <div className="flex flex-col px-4 py-2 bg-background/50 rounded-xl border border-border/50">
                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Tomes possédés</span>
                                <span className="text-2xl font-display font-black text-white">{seriesMangas.length}</span>
                            </div>
                            
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleRemoveSeries}
                                disabled={isOffline}
                                className="rounded-xl h-auto py-3 px-6"
                            >
                                {isOffline ? <WifiOff className="mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                <span className="font-black uppercase tracking-widest text-[11px] h-4">
                                    {isOffline ? "Hors ligne" : "Retirer la série"}
                                </span>
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Editions Section */}
            <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                    <h2 className="text-3xl font-display font-black flex items-center gap-3 uppercase tracking-tight">
                        <BookOpen className="h-8 w-8 text-primary" />
                        Mes Éditions
                    </h2>
                </div>

                <EditionList
                    series={series}
                    editionsList={editionsList}
                    baseUrl={`/collection/series/${seriesId}`}
                    isAddingAll={isAddingAll}
                    isOffline={isOffline}
                    onAddAll={(edition, total, numbers) => handleAddAll({ preventDefault: () => { }, stopPropagation: () => { } } as unknown as React.MouseEvent, edition, total, numbers)}
                    onLoanEdition={(unloaned) => {
                        setSelectedMangaForLoan(unloaned);
                        setIsLoanDialogOpen(true);
                    }}
                />
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
