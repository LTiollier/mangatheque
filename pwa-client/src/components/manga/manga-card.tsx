"use client";

import { MangaSearchResult } from "@/types/manga";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, WifiOff, Heart as LucideHeart } from "lucide-react";
import Image from "next/image";
import { useOffline } from "@/contexts/OfflineContext";

interface MangaCardProps {
    manga: MangaSearchResult;
    onAdd?: (manga: MangaSearchResult) => void;
    onAddToWishlist?: (manga: MangaSearchResult) => void;
    isLoading?: boolean;
    isWishlistLoading?: boolean;
}

export function MangaCard({ manga, onAdd, onAddToWishlist, isLoading, isWishlistLoading }: MangaCardProps) {
    const { isOffline } = useOffline();
    return (
        <Card className="overflow-hidden flex flex-col h-full bg-card hover:shadow-lg transition-shadow duration-300">
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
            {(onAdd || onAddToWishlist) && (
                <CardFooter className="p-4 pt-0 flex gap-2">
                    {onAdd && (
                        <Button
                            className="flex-1"
                            variant={isOffline ? "secondary" : "outline"}
                            onClick={() => onAdd(manga)}
                            disabled={isLoading || isOffline}
                            title="Ajouter à ma collection"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isOffline ? (
                                <WifiOff className="h-4 w-4" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            <span className="sr-only sm:not-sr-only sm:ml-2">Ajouter</span>
                        </Button>
                    )}
                    {onAddToWishlist && (
                        <Button
                            className="flex-1"
                            variant={isOffline ? "secondary" : "secondary"}
                            onClick={() => onAddToWishlist(manga)}
                            disabled={isWishlistLoading || isOffline}
                            title="Ajouter aux souhaits"
                        >
                            {isWishlistLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isOffline ? (
                                <WifiOff className="h-4 w-4" />
                            ) : (
                                <LucideHeart className="h-4 w-4" />
                            )}
                            <span className="sr-only sm:not-sr-only sm:ml-2">Souhait</span>
                        </Button>
                    )}
                </CardFooter>
            )}
        </Card>
    );
}
