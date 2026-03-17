"use client";

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { Manga, Edition, Series } from '@/types/manga';
import { mangaService } from '@/services/manga.service';
import { toast } from 'sonner';
import { SeriesDetailView } from '@/components/series/SeriesDetailView';

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
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xl">Série introuvable</p>
                <button onClick={() => router.back()} className="text-primary font-bold uppercase tracking-widest text-xs hover:underline">Retour</button>
            </div>
        );
    }

    return (
        <SeriesDetailView
            series={series}
            volumes={volumes}
            editionsList={editionsList}
            baseUrl={`/search/series/${seriesId}`}
            backLink="/search"
            backLabel="Retour à la recherche"
            isAddingAll={isAddingAll}
            onAddAll={(edition, total, numbers) => handleAddAll(edition, total, numbers)}
        />
    );
}
