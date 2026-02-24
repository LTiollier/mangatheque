"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LucideLayoutDashboard, LucideBook, LucideHeart, LucideSettings, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Manga } from '@/types/manga';
import { MangaCard } from '@/components/manga/manga-card';
import { mangaService } from '@/services/manga.service';

export default function DashboardPage() {
    const { user } = useAuth();
    const [mangas, setMangas] = useState<Manga[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMangas = async () => {
            try {
                const data = await mangaService.getCollection();
                setMangas(data);
            } catch (error) {
                console.error('Failed to fetch mangas:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMangas();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Welcome Card */}
            <div className="p-8 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/20 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12 transition-transform duration-500 group-hover:rotate-0 group-hover:scale-[1.7]">
                    <LucideLayoutDashboard className="h-40 w-40 text-white" />
                </div>

                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2">Bienvenue, <span className="text-purple-400">{user?.name}</span> !</h2>
                    <p className="text-slate-400 max-w-xl">
                        Votre collection de mangas est à portée de main. Scannez de nouveaux tomes, gérez vos prêts et restez à jour.
                    </p>
                    <div className="flex gap-4 mt-8">
                        <Button asChild className="bg-white text-slate-950 hover:bg-slate-200 font-bold rounded-xl px-6">
                            <Link href="/collection">Ma Collection</Link>
                        </Button>
                        <Button asChild variant="outline" className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 rounded-xl px-6">
                            <Link href="/search">Rechercher</Link>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Quick Stats/Actions */}
                <Link
                    href="/collection"
                    className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors group cursor-pointer"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                            <LucideBook className="h-6 w-6 text-blue-400" />
                        </div>
                        <h3 className="font-bold">Ma Collection</h3>
                    </div>
                    <p className="text-4xl font-black mb-2">{isLoading ? <Loader2 className="animate-spin h-8 w-8 text-blue-500" /> : mangas.length}</p>
                    <p className="text-slate-500 text-sm">Mangas enregistrés</p>
                </Link>

                <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-pink-500/10 rounded-xl">
                            <LucideHeart className="h-6 w-6 text-pink-400" />
                        </div>
                        <h3 className="font-bold">Wishlist</h3>
                    </div>
                    <p className="text-4xl font-black mb-2">0</p>
                    <p className="text-slate-500 text-sm">Tombeurs de portefeuille</p>
                </div>

                <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-slate-800 rounded-xl">
                            <LucideSettings className="h-6 w-6 text-slate-400" />
                        </div>
                        <h3 className="font-bold">Paramètres</h3>
                    </div>
                    <p className="text-slate-500 text-sm mb-6">Gérez votre profil et vos préférences.</p>
                    <Button variant="outline" className="w-full border-slate-800 hover:bg-slate-800 rounded-xl">
                        Modifier le profil
                    </Button>
                </div>
            </div>

            {/* Collection Section */}
            <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">Dernièrement ajoutés</h3>
                    <Button asChild variant="ghost" className="text-purple-400 hover:text-purple-300">
                        <Link href="/search">
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter
                        </Link>
                    </Button>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="aspect-[2/3] animate-pulse bg-slate-900 rounded-2xl border border-slate-800" />
                        ))}
                    </div>
                ) : mangas.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {mangas.slice(0, 8).map((manga) => (
                            <MangaCard key={manga.id} manga={manga} />
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl">
                        <p className="text-slate-500 mb-6">Votre collection est vide pour le moment.</p>
                        <Button asChild className="bg-purple-600 hover:bg-purple-500 font-bold rounded-xl px-8">
                            <Link href="/search">Rechercher mon premier manga</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
