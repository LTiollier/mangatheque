"use client";

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trash2, WifiOff, BookOpen } from 'lucide-react';
import { Manga, Series, Edition, BoxSet } from '@/types/manga';
import { useAlert } from '@/contexts/AlertContext';
import { useOffline } from '@/contexts/OfflineContext';
import { LoanDialog } from '@/components/manga/loan-dialog';
import { mangaService } from '@/services/manga.service';
import { wishlistService } from '@/services/wishlist.service';
import { userService } from '@/services/user.service';
import { SeriesDetailView } from '@/components/series/SeriesDetailView';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
    const [isAddingToWishlist, setIsAddingToWishlist] = useState<number | null>(null);
    const [isLoanDialogOpen, setIsLoanDialogOpen] = useState(false);
    const [selectedMangaForLoan, setSelectedMangaForLoan] = useState<Manga[]>([]);

    const fetchData = useCallback(async () => {
        try {
            const seriesIdInt = parseInt(seriesId);
            const seriesData = await mangaService.getSeries(seriesIdInt);
            setSeries(seriesData);
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
                volumes: (edition.volumes || []).map(v => ({ 
                    ...v,
                    is_owned: !!v.is_owned,
                    is_wishlisted: !!v.is_wishlisted,
                    edition: edition
                })) as Manga[]
            }))
            .filter(item => item.volumes.length > 0 || (item.edition.total_volumes && item.edition.total_volumes > 0));
    }, [series]);

    const handleAddAll = async (edition: Edition) => {
        const missing = (edition.volumes || [])
            .filter(v => !v.is_owned)
            .map(v => parseInt(v.number || '0'))
            .filter(n => !isNaN(n) && n > 0);

        if (missing.length === 0) return;

        setIsAddingAll(edition.id);
        try {
            await mangaService.addBulk(edition.id, missing);
            toast.success(`${missing.length} tome(s) ajouté(s)`);
            await fetchData();
        } catch (error) {
            console.error('Failed to add all volumes', error);
            toast.error("Erreur lors de l'ajout");
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
            toast.success(`Coffret ${boxSet.title} ajouté`);
            await fetchData();
        } catch (error) {
            console.error('Failed to add box set', error);
            toast.error("Erreur lors de l'ajout");
        } finally {
            setIsAddingAll(null);
        }
    };

    const handleAddToWishlist = async (edition: Edition) => {
        const missingVolumes = (edition.volumes || []).filter(v => !v.is_owned);
        const isCurrentlyWishlisted = missingVolumes.length > 0 && missingVolumes.every(v => v.is_wishlisted);

        if (isCurrentlyWishlisted) {
            // Remove from wishlist
            setIsAddingToWishlist(edition.id);
            try {
                for (const v of missingVolumes) {
                    if (v.is_wishlisted) {
                        await wishlistService.remove(String(v.id));
                    }
                }
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

        const apiIds = missingVolumes
            .map(v => v.api_id)
            .filter((id): id is string => !!id);

        if (apiIds.length === 0) {
            toast.info("Tous les tomes sont déjà possédés !");
            return;
        }

        setIsAddingToWishlist(edition.id);
        try {
            await wishlistService.addBulk(apiIds);
            toast.success("Ajouté à la wishlist");
            await fetchData();
        } catch (error) {
            console.error('Failed to add to wishlist', error);
            toast.error("Erreur lors de l'ajout");
        } finally {
            setIsAddingToWishlist(null);
        }
    };

    const handleAddBoxSetToWishlist = async (boxSet: BoxSet) => {
        const isCurrentlyWishlisted = boxSet.boxes.some(b => !b.is_owned && b.is_wishlisted);

        if (isCurrentlyWishlisted) {
            // Remove from wishlist
            setIsAddingToWishlist(boxSet.id);
            try {
                for (const box of boxSet.boxes) {
                    if (!box.is_owned && box.is_wishlisted) {
                        // Assuming box removal from wishlist is also by ID
                        // NOTE: If backend only supports volume removal, we'd need to loop over box volumes.
                        // But box itself has an api_id if it's a box from mangacollec.
                        if (box.api_id) {
                            // Find corresponding volume IDs or similar
                            // For now let's use the box api_id if it was added as such
                            // Wait, wishlistService.remove takes mangaId (database ID).
                            // This part is tricky if we don't have a direct box wishlist link in backend.
                            // But usually boxes in wishlist are just their volumes.
                            const boxData = await mangaService.getBox(box.id);
                            if (boxData.volumes) {
                                for (const v of boxData.volumes) {
                                    if (v.is_wishlisted) {
                                        await wishlistService.remove(String(v.id));
                                    }
                                }
                            }
                        }
                    }
                }
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

        if (!boxSet.api_id) {
            toast.error("Identifiant du coffret manquant.");
            return;
        }

        setIsAddingToWishlist(boxSet.id);
        try {
            await wishlistService.add(boxSet.api_id);
            toast.success("Ajouté à la wishlist");
            await fetchData();
        } catch (error) {
            console.error('Failed to add box set to wishlist', error);
            toast.error("Erreur lors de l'ajout");
        } finally {
            setIsAddingToWishlist(null);
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
                isAddingToWishlist={isAddingToWishlist}
                isOffline={isOffline}
                editionsTitle="Mes Éditions"
                onAddAll={handleAddAll}
                onAddBoxSetAll={handleAddBoxSetAll}
                onAddToWishlist={handleAddToWishlist}
                onAddBoxSetToWishlist={handleAddBoxSetToWishlist}
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
