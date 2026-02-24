"use client";

import { Loader2, HeartCrack, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useOffline } from "@/contexts/OfflineContext";
import { WifiOff } from "lucide-react";
import { useWishlist, useRemoveFromWishlist } from "@/hooks/queries";

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
                        <Card key={manga.id} className="overflow-hidden flex flex-col h-full bg-card hover:shadow-lg transition-shadow duration-300">
                            <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
                                {manga.cover_url ? (
                                    <Image
                                        src={manga.cover_url}
                                        alt={manga.title}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground italic text-sm text-center px-4">
                                        Pas de couverture
                                    </div>
                                )}
                            </div>
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-lg line-clamp-2 min-h-[3.5rem]">{manga.title}</CardTitle>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                    {manga.authors && manga.authors.length > 0 ? manga.authors.join(", ") : "Auteur inconnu"}
                                </p>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 flex-grow">
                                {manga.isbn && (
                                    <p className="text-xs text-muted-foreground mt-1">ISBN: {manga.isbn}</p>
                                )}
                            </CardContent>
                            <CardFooter className="p-4 pt-0">
                                <Button
                                    className="w-full"
                                    variant="destructive"
                                    onClick={() => removeFromWishlist.mutate(String(manga.id))}
                                    disabled={removeFromWishlist.isPending || isOffline}
                                >
                                    {removeFromWishlist.isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : isOffline ? (
                                        <WifiOff className="mr-2 h-4 w-4" />
                                    ) : (
                                        <Trash2 className="mr-2 h-4 w-4" />
                                    )}
                                    {removeFromWishlist.isPending ? "Retrait..." : isOffline ? "Hors ligne" : "Retirer"}
                                </Button>
                            </CardFooter>
                        </Card>
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
