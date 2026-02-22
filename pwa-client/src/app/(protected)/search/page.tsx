"use client";

import { useState } from "react";
import { MangaSearchBar } from "@/components/manga/manga-search-bar";
import { MangaCard } from "@/components/manga/manga-card";
import { MangaSearchResult } from "@/types/manga";
import api from "@/lib/api";
import { Loader2, SearchX } from "lucide-react";

export default function SearchPage() {
    const [results, setResults] = useState<MangaSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (query: string) => {
        setIsLoading(true);
        setError(null);
        setHasSearched(true);
        try {
            const response = await api.get(`/mangas/search?query=${encodeURIComponent(query)}`);
            setResults(response.data.data);
        } catch (err: unknown) {
            console.error("Search failed:", err);
            const errorMessage = err instanceof Error ? err.message : "Something went wrong while searching.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToCollection = (manga: MangaSearchResult) => {
        // This will be implemented in Step 7
        console.log("Add to collection:", manga);
        alert(`Adding "${manga.title}" to collection (Feature coming in Step 7!)`);
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto py-6 px-4">
            <div className="space-y-4 text-center">
                <h1 className="text-3xl font-bold tracking-tight">Search Mangas</h1>
                <p className="text-muted-foreground">
                    Search for mangas to add to your collection by title or ISBN.
                </p>
                <div className="max-w-2xl mx-auto">
                    <MangaSearchBar onSearch={handleSearch} isLoading={isLoading} />
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Fetching results...</p>
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
                        />
                    ))}
                </div>
            ) : hasSearched ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-4">
                    <SearchX className="h-12 w-12" />
                    <div className="text-center">
                        <p className="text-xl font-medium">No mangas found</p>
                        <p>Try searching for something else or check the ISBN.</p>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="rounded-2xl border-2 border-dashed border-muted p-12 max-w-md mx-auto">
                        <p className="text-muted-foreground">
                            Results will appear here once you start searching.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
