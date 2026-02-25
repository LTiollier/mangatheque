"use client";

import { MangaCard } from "@/components/manga/manga-card";
import { HeartCrack } from "lucide-react";
import { useWishlist, useRemoveFromWishlist } from "@/hooks/queries";

export default function WishlistPage() {
    const { data: wishlist = [], isLoading, error } = useWishlist();
    const removeFromWishlist = useRemoveFromWishlist();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider">
                        <HeartCrack className="h-3 w-3" />
                        Envies
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Ma Liste de Souhaits
                    </h1>
                    <p className="text-slate-400 font-medium">
                        Retrouvez ici les mangas que vous souhaitez acquérir prochainement.
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="aspect-[2/3] animate-pulse bg-slate-900 rounded-2xl border border-slate-800" />
                    ))}
                </div>
            ) : error ? (
                <div className="bg-red-500/10 text-red-400 p-6 rounded-2xl flex items-center justify-center gap-2 border border-red-500/20">
                    <p className="font-bold">Impossible de charger la liste de souhaits.</p>
                </div>
            ) : wishlist.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {wishlist.map((manga) => (
                        <MangaCard
                            key={manga.id}
                            manga={manga}
                            onRemove={() => removeFromWishlist.mutate(String(manga.id))}
                            isRemoveLoading={removeFromWishlist.isPending}
                        />
                    ))}
                </div>
            ) : (
                <div className="p-20 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl">
                    <div className="bg-slate-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800">
                        <HeartCrack className="h-10 w-10 text-slate-700" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Votre liste de souhaits est vide</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        Recherchez des mangas pour les ajouter ici et suivre vos prochaines acquisitions.
                    </p>
                </div>
            )}
        </div>
    );
}
