"use client";

import { useState } from "react";
import { MangaSearchBar } from "@/components/manga/manga-search-bar";
import { MangaCard } from "@/components/manga/manga-card";
import { MangaSearchResult } from "@/types/manga";
import { Loader2, SearchX } from "lucide-react";
import { toast } from "sonner";
import { mangaService } from "@/services/manga.service";
import { wishlistService } from "@/services/wishlist.service";
import { getApiErrorMessage } from "@/lib/error";

export default function SearchPage() {
    const [results, setResults] = useState<MangaSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState<string | null>(null);
    const [isAddingToWishlist, setIsAddingToWishlist] = useState<string | null>(null);

    const handleSearch = async (query: string) => {
        setIsLoading(true);
        setError(null);
        setHasSearched(true);
        try {
            const data = await mangaService.search(query);
            setResults(data);
        } catch (err: unknown) {
            console.error("Search failed:", err);
            setError(getApiErrorMessage(err, "Une erreur est survenue lors de la recherche."));
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToCollection = async (manga: MangaSearchResult) => {
        setIsAdding(manga.api_id);
        try {
            await mangaService.addToCollection(manga.api_id);
            toast.success(`${manga.title} ajouté à votre collection !`);
        } catch (err: unknown) {
            console.error("Add failed:", err);
            toast.error(getApiErrorMessage(err, "Échec de l'ajout du manga à la collection."));
        } finally {
            setIsAdding(null);
        }
    };

    const handleAddToWishlist = async (manga: MangaSearchResult) => {
        setIsAddingToWishlist(manga.api_id);
        try {
            await wishlistService.add(manga.api_id);
            toast.success(`${manga.title} ajouté à votre liste de souhaits !`);
        } catch (err: unknown) {
            console.error("Add to wishlist failed:", err);
            toast.error(getApiErrorMessage(err, "Échec de l'ajout à la liste de souhaits."));
        } finally {
            setIsAddingToWishlist(null);
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto py-6 px-4">
            <div className="space-y-4 text-center">
                <h1 className="text-3xl font-bold tracking-tight">Rechercher des Mangas</h1>
                <p className="text-muted-foreground">
                    Recherchez des mangas à ajouter à votre collection par titre ou ISBN.
                </p>
                <div className="max-w-2xl mx-auto">
                    <MangaSearchBar onSearch={handleSearch} isLoading={isLoading} />
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Recherche en cours...</p>
                </div>
            ) : error ? (
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center justify-center gap-2 border border-destructive/20">
                    <p>{error}</p>
                </div>
            ) : results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {results.map((manga) => (
                        <MangaCard
                            key={manga.api_id}
                            manga={manga}
                            onAdd={handleAddToCollection}
                            onAddToWishlist={handleAddToWishlist}
                            isLoading={isAdding === manga.api_id}
                            isWishlistLoading={isAddingToWishlist === manga.api_id}
                        />
                    ))}
                </div>
            ) : hasSearched ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-4">
                    <SearchX className="h-12 w-12" />
                    <div className="text-center">
                        <p className="text-xl font-medium">Aucun manga trouvé</p>
                        <p>Essayez une autre recherche ou vérifiez l&apos;ISBN.</p>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="rounded-2xl border-2 border-dashed border-muted p-12 max-w-md mx-auto">
                        <p className="text-muted-foreground">
                            Les résultats apparaîtront ici une fois la recherche lancée.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
