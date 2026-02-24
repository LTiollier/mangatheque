"use client";

import { MangaCard } from "@/components/manga/manga-card";
import { Loader2, HeartCrack } from "lucide-react";
import { useWishlist, useRemoveFromWishlist } from "@/hooks/queries";
import { useOffline } from "@/contexts/OfflineContext";

export default function WishlistPage() {
    const { data: wishlist = [], isLoading, error } = useWishlist();
    const removeFromWishlist = useRemoveFromWishlist();
    const { isOffline } = useOffline();

    return (
        <div className="space-y-8 max-w-6xl mx-auto py-6 px-4">
            <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tight">Ma Liste de Souhaits</h1>
                <p className="text-muted-foreground">
                    Retrouvez ici les mangas que vous souhaitez acquérir.
                </p>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Chargement de la liste...</p>
                </div>
            ) : error ? (
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center justify-center gap-2 border border-destructive/20">
                    <p>Impossible de charger la liste de souhaits.</p>
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
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-4">
                    <HeartCrack className="h-12 w-12" />
                    <div className="text-center">
                        <p className="text-xl font-medium">Votre liste de souhaits est vide</p>
                        <p>Recherchez des mangas pour les ajouter ici.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
