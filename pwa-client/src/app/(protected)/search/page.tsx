"use client";

import { useState } from "react";
import { MangaSearchBar } from "@/components/manga/manga-search-bar";
import { MangaCard } from "@/components/manga/manga-card";
import { MangaSearchResult } from "@/types/manga";
import { Loader2, SearchX } from "lucide-react";
import { mangaService } from "@/services/manga.service";
import { getApiErrorMessage } from "@/lib/error";

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
            const data = await mangaService.search(query);
            setResults(data);
        } catch (err: unknown) {
            console.error("Search failed:", err);
            setError(getApiErrorMessage(err, "Une erreur est survenue lors de la recherche."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
            <Loader2 className="h-3 w-3" />
                        Exploration
                    </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Recherche
                    </h1>
          <p className="text-slate-400 font-medium">
                        Trouvez de nouveaux mangas à ajouter à votre collection.
                    </p>
                </div>

        <div className="max-w-2xl w-full md:w-auto">
                    <MangaSearchBar onSearch={handleSearch} isLoading={isLoading} />
                </div>
            </div>

            {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[2/3] animate-pulse bg-slate-900 rounded-2xl border border-slate-800" />
                    ))}
                </div>
            ) : error ? (
        <div className="bg-red-500/10 text-red-400 p-6 rounded-2xl flex items-center justify-center gap-3 border border-red-500/20">
          <p className="font-bold">{error}</p>
                </div>
            ) : results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {results.map((manga) => (
                        <MangaCard
                            key={manga.api_id}
                            manga={manga}
                            href={manga.id ? `/search/series/${manga.id}` : undefined}
                        />
                    ))}
                </div>
            ) : hasSearched ? (
        <div className="p-20 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl">
          <div className="bg-slate-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800">
            <SearchX className="h-10 w-10 text-slate-700" />
                    </div>
          <h3 className="text-xl font-bold mb-2">Aucun manga trouvé</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
                        Essayez une autre recherche ou vérifiez l&apos;ISBN.
                    </p>
                </div>
            ) : (
        <div className="p-20 text-center bg-slate-900/10 border border-dashed border-slate-800 rounded-3xl">
          <p className="text-slate-500 font-medium">
                        Les résultats apparaîtront ici une fois la recherche lancée.
                    </p>
                </div>
            )}
        </div>
    );
}
