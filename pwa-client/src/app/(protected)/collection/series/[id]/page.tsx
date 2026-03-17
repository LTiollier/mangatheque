"use client";

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trash2, WifiOff, BookOpen } from 'lucide-react';
import { Manga, Series, Edition } from '@/types/manga';
import { useAlert } from '@/contexts/AlertContext';
import { useOffline } from '@/contexts/OfflineContext';
import { LoanDialog } from '@/components/manga/loan-dialog';
import { mangaService } from '@/services/manga.service';
import { userService } from '@/services/user.service';
import { SeriesDetailView } from '@/components/series/SeriesDetailView';
import { Button } from '@/components/ui/button';

export default function SeriesPage() {
    const params = useParams();
    const router = useRouter();
    const seriesId = params.id as string;
    const { confirm } = useAlert();
    const { isOffline } = useOffline();

    const [series, setSeries] = useState<Series | null>(null);
    const [volumes, setVolumes] = useState<Manga[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingAll, setIsAddingAll] = useState<number | null>(null);
    const [isLoanDialogOpen, setIsLoanDialogOpen] = useState(false);
    const [selectedMangaForLoan, setSelectedMangaForLoan] = useState<Manga[]>([]);

    const fetchData = useCallback(async () => {
        try {
            const seriesIdInt = parseInt(seriesId);
            const seriesData = await mangaService.getSeries(seriesIdInt);
            setSeries(seriesData);
            
            // On ne récupère plus les volumes un par un pour chaque édition.
            // Le backend renvoie maintenant les possessed_count et possessed_numbers dans SeriesResource.
            // On peut toutefois initialiser volumes à vide ou à une liste simplifiée si besoin.
            setVolumes([]); 
        } catch (error) {
            console.error('Failed to fetch series data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [seriesId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const editionsList = useMemo(() => {
        if (!series || !series.editions) return [];
        
        return series.editions
            .map(edition => ({
                edition: edition,
                // On simule des volumes owned via possessed_count si on veut garder la compatibilité
                // avec le composant qui s'attend à une liste de volumes.
                // OU alors on adapte le composant EditionList.
                volumes: (edition.possessed_numbers || []).map(num => ({ 
                    id: 0, // ID fictif car on n'en a pas besoin ici
                    number: num.toString(),
                    is_owned: true,
                    edition: edition
                })) as Manga[]
            }))
            .filter(item => item.volumes.length > 0 || (item.edition.total_volumes && item.edition.total_volumes > 0));
    }, [series]);

    const handleAddAll = async (edition: Edition, totalVolumes: number, possessedNumbers: Set<number>) => {
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
            await fetchData();
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
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in fade-in duration-700">
                <div className="relative">
                    <div className="h-20 w-20 rounded-full border-t-2 border-primary animate-spin" />
                    <BookOpen className="h-8 w-8 text-primary absolute inset-0 m-auto animate-pulse" />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Extraction des données de votre collection...</p>
            </div>
        );
    }

    if (!series) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xl">Série introuvable ou collection vide</p>
                <button onClick={() => router.back()} className="text-primary font-bold uppercase tracking-widest text-xs hover:underline">Retour</button>
            </div>
        );
    }

    return (
        <>
            <SeriesDetailView
                series={series}
                volumes={volumes}
                editionsList={editionsList}
                baseUrl={`/collection/series/${seriesId}`}
                backLink="/collection"
                backLabel="Retour à la collection"
                isAddingAll={isAddingAll}
                isOffline={isOffline}
                editionsTitle="Mes Éditions"
                onAddAll={handleAddAll}
                onLoanEdition={(unloaned) => {
                    setSelectedMangaForLoan(unloaned);
                    setIsLoanDialogOpen(true);
                }}
                heroActions={
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
                }
            />

            <LoanDialog
                mangas={selectedMangaForLoan}
                open={isLoanDialogOpen}
                onOpenChange={setIsLoanDialogOpen}
                onSuccess={() => {
                    fetchData();
                    setSelectedMangaForLoan([]);
                }}
            />
        </>
    );
}
