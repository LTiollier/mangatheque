"use client";

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { Manga, Edition, Series, BoxSet } from '@/types/manga';
import { mangaService } from '@/services/manga.service';
import { wishlistService } from '@/services/wishlist.service';
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
    const [isAddingToWishlist, setIsAddingToWishlist] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const seriesData = await mangaService.getSeries(seriesId);
            setSeries(seriesData);
            setVolumes([]); 
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
            volumes: (edition.volumes || []).map(v => ({
                ...v,
                is_owned: !!v.is_owned,
                edition: edition
            })) as Manga[]
        }));
    }, [series]);

    const handleAddAll = async (edition: Edition) => {
        const missing = (edition.volumes || [])
            .filter(v => !v.is_owned)
            .map(v => parseInt(v.number || '0'))
            .filter(n => !isNaN(n) && n > 0);

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

    const handleAddBoxSetAll = async (boxSet: BoxSet) => {
        setIsAddingAll(boxSet.id);
        try {
            for (const box of boxSet.boxes) {
                if (!box.is_owned) {
                    await mangaService.addBoxToCollection(box.id, true);
                }
            }
            toast.success(`Ajout du coffret ${boxSet.title} réussi !`);
            await fetchData();
        } catch (error) {
            console.error('Failed to add box set', error);
            toast.error("Échec de l'ajout du coffret.");
        } finally {
            setIsAddingAll(null);
        }
    };

    const handleAddToWishlist = async (edition: Edition) => {
        if (edition.is_wishlisted) {
            setIsAddingToWishlist(edition.id);
            try {
                await wishlistService.remove(edition.id, 'edition');
                toast.success("Retiré de la wishlist");
                await fetchData();
            } catch (error) {
                console.error('Failed to remove from wishlist', error);
                toast.error("Erreur lors du retrait");
            } finally {
                setIsAddingToWishlist(null);
            }
            return;
        }

        setIsAddingToWishlist(edition.id);
        try {
            await wishlistService.addByEditionId(edition.id);
            toast.success("Ajouté à la wishlist");
            await fetchData();
        } catch (error) {
            console.error('Failed to add to wishlist', error);
            toast.error("Erreur lors de l'ajout");
        } finally {
            setIsAddingToWishlist(null);
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
            isAddingToWishlist={isAddingToWishlist}
            onAddAll={handleAddAll}
            onAddBoxSetAll={handleAddBoxSetAll}
            onAddToWishlist={handleAddToWishlist}
        />
    );
}
