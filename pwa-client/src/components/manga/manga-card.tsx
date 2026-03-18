"use client";

import { MangaSearchResult } from "@/types/manga";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, WifiOff, Heart as LucideHeart, Trash2, User } from "lucide-react";
import { useOffline } from "@/contexts/OfflineContext";
import { cn } from "@/lib/utils";
import { MangaCover } from "../ui/manga-cover";

import Link from "next/link";

interface MangaCardProps {
    manga: MangaSearchResult;
    href?: string;
    onAdd?: (manga: MangaSearchResult) => void;
    onAddToWishlist?: (manga: MangaSearchResult) => void;
    onRemove?: (manga: MangaSearchResult) => void;
    isLoading?: boolean;
    isWishlistLoading?: boolean;
    isRemoveLoading?: boolean;
}

export function MangaCard({
    manga,
    href,
    onAdd,
    onAddToWishlist,
    onRemove,
    isLoading,
    isWishlistLoading,
    isRemoveLoading
}: MangaCardProps) {
    const { isOffline } = useOffline();

    const CardContent = (
        <div className={cn(
            "relative aspect-[2/3] w-full bg-card rounded-2xl overflow-hidden manga-panel transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 shadow-sm hover:shadow-2xl hover:shadow-primary/20",
            href && "cursor-pointer"
        )}>
            <MangaCover 
                src={manga.cover_url} 
                alt={manga.title} 
                title={manga.title}
                className="group-hover:scale-110"
            />
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-black/10 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Actions Grid - Appear on hover */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                {onAdd && (
                    <Button
                        size="icon"
                        className="h-10 w-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg border-2 border-background"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAdd(manga); }}
                        disabled={isLoading || isOffline}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
                    </Button>
                )}
                {onAddToWishlist && (
                    <Button
                        size="icon"
                        className="h-10 w-10 bg-background/80 backdrop-blur-md hover:bg-background text-primary rounded-full shadow-lg border-2 border-border"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToWishlist(manga); }}
                        disabled={isWishlistLoading || isOffline}
                    >
                        {isWishlistLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LucideHeart className="h-4 w-4" />}
                    </Button>
                )}
                {onRemove && (
                    <Button
                        size="icon"
                        className="h-10 w-10 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full shadow-lg border-2 border-background"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(manga); }}
                        disabled={isRemoveLoading || isOffline}
                    >
                        {isRemoveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                )}
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="space-y-0.5 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center gap-1 text-[9px] text-primary font-black uppercase tracking-widest overflow-hidden">
                        <User className="h-2.5 w-2.5 flex-shrink-0" />
                        <span className="truncate">
                            {manga.authors && manga.authors.length > 0 ? manga.authors[0] : "Auteur inconnu"}
                        </span>
                    </div>
                    <h3 className="text-white font-display font-black text-base leading-tight line-clamp-2 uppercase tracking-tight drop-shadow-2xl">
                        {manga.title}
                    </h3>
                </div>
            </div>

            {isOffline && (
                <div className="absolute top-3 left-3 p-1.5 bg-background/50 backdrop-blur-sm rounded-full">
                    <WifiOff className="h-3 w-3 text-muted-foreground" />
                </div>
            )}
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="group relative block">
                {CardContent}
            </Link>
        );
    }

    return (
        <div className="group relative block">
            {CardContent}
        </div>
    );
}
