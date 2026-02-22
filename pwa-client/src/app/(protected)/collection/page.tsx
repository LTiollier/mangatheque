"use client";

import { Button } from '@/components/ui/button';
import { LucideBook, Loader2, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Manga } from '@/types/manga';
import { MangaCard } from '@/components/manga/manga-card';

export default function CollectionPage() {
    const [mangas, setMangas] = useState<Manga[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchMangas = async () => {
            try {
                const response = await api.get('/mangas');
                setMangas(response.data.data);
            } catch (error) {
                console.error('Failed to fetch mangas:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMangas();
    }, []);

    const filteredMangas = mangas.filter(manga =>
        manga.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manga.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (manga.isbn && manga.isbn.includes(searchQuery))
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                        <LucideBook className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Ma Collection</h1>
                        <p className="text-slate-500 text-sm">
                            {isLoading ? "Chargement..." : `${mangas.length} mangas enregistrés`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Filtrer ma collection..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 w-full md:w-64"
                        />
                    </div>
                    <Button asChild className="bg-purple-600 hover:bg-purple-500 font-bold rounded-xl whitespace-nowrap">
                        <Link href="/search">
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter
                        </Link>
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                        <div key={i} className="aspect-[2/3] animate-pulse bg-slate-900 rounded-2xl border border-slate-800" />
                    ))}
                </div>
            ) : filteredMangas.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredMangas.map((manga) => (
                        <MangaCard key={manga.id} manga={manga} />
                    ))}
                </div>
            ) : (
                <div className="p-20 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl">
                    <div className="bg-slate-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800">
                        <LucideBook className="h-10 w-10 text-slate-700" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Aucun manga trouvé</h3>
                    <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                        {searchQuery
                            ? "Aucun résultat ne correspond à votre recherche dans votre collection."
                            : "Votre collection est vide. Commencez par ajouter vos mangas préférés !"}
                    </p>
                    <Button asChild className="bg-purple-600 hover:bg-purple-500 font-bold rounded-xl px-8">
                        <Link href="/search">Rechercher un manga</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
