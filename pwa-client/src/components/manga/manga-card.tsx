"use client";

import { MangaSearchResult } from "@/types/manga";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import Image from "next/image";

interface MangaCardProps {
    manga: MangaSearchResult;
    onAdd?: (manga: MangaSearchResult) => void;
    isLoading?: boolean;
}

export function MangaCard({ manga, onAdd, isLoading }: MangaCardProps) {
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
            {onAdd && (
                <CardFooter className="p-4 pt-0">
                    <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => onAdd?.(manga)}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="mr-2 h-4 w-4" />
                        )}
                        {isLoading ? "Ajout..." : "Ajouter à ma collection"}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
