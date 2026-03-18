"use client";

import { Series, Edition, Manga } from "@/types/manga";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Check, Loader2, Plus, ArrowLeftRight, Building2, Globe, Heart } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MangaCover } from "@/components/ui/manga-cover";
import { cn } from "@/lib/utils";

interface EditionGroup {
    edition: Edition;
    volumes: Manga[];
}

interface EditionListProps {
    series: Series;
    editionsList: EditionGroup[];
    baseUrl: string;
    isReadOnly?: boolean;
    isAddingAll?: number | null;
    isAddingToWishlist?: number | null;
    isOffline?: boolean;
    onAddAll?: (edition: Edition) => void;
    onAddToWishlist?: (edition: Edition) => void;
    onLoanEdition?: (volumes: Manga[]) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4 } }
};

export function EditionList({
    series,
    editionsList,
    baseUrl,
    isReadOnly = false,
    isAddingAll = null,
    isAddingToWishlist = null,
    isOffline = false,
    onAddAll,
    onAddToWishlist,
    onLoanEdition
}: EditionListProps) {
    return (
        <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-6"
        >
            {editionsList.map(({ edition, volumes }) => {
                const total = edition.total_volumes;
                const hasTotal = Boolean(total && total > 0);
                const possessedCount = volumes.filter(v => v.is_owned).length;
                const percentage = hasTotal && total ? Math.min(100, (possessedCount / total) * 100) : null;
                const isComplete = hasTotal && possessedCount >= (total || 0);

                // Une édition est considérée comme étant dans la wishlist si au moins un de ses tomes (non possédés) y est.
                // Ici on vérifie si tous les tomes manquants sont dans la wishlist pour considérer l'édition comme "wishlisted".
                const isWishlisted = !!edition.is_wishlisted;

                // Use the first possessed volume's cover if available, otherwise edition cover, otherwise series cover
                const ownedVolumes = volumes.filter(v => v.is_owned);
                const coverUrl = ownedVolumes.length > 0 ? (ownedVolumes[0].cover_url || edition.cover_url || series.cover_url) : (edition.cover_url || series.cover_url);

                return (
                    <motion.div key={edition.id} variants={item}>
                        <Card className="premium-glass hover:bg-card/80 transition-all rounded-[1.5rem] overflow-hidden border border-border/50 group flex flex-row min-h-[10rem] md:min-h-[12rem]">
                            {/* Left Side: Cover Image */}
                            <Link href={`${baseUrl}/edition/${edition.id}`} className="relative w-28 md:w-32 flex-shrink-0 min-h-[10rem] md:min-h-[12rem] aspect-[2/3] overflow-hidden border-r border-white/5">
                                <MangaCover 
                                    src={coverUrl} 
                                    alt={edition.name} 
                                    title={edition.name}
                                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                                />
                                {isComplete && (
                                    <div className="absolute top-3 left-3 bg-primary text-primary-foreground p-1.5 rounded-full shadow-2xl z-10">
                                        <Check className="h-3.5 w-3.5" />
                                    </div>
                                )}
                            </Link>

                            {/* Right Side: Content */}
                            <div className="flex-1 flex flex-col p-5 md:p-8 justify-between">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <Link href={`${baseUrl}/edition/${edition.id}`} className="flex-1 min-w-0">
                                            <CardTitle className="text-2xl md:text-3xl font-display font-black uppercase tracking-tight text-white group-hover:text-primary transition-colors line-clamp-1 leading-none">
                                                {edition.name}
                                            </CardTitle>
                                            <div className="flex gap-3 mt-3">
                                                <div className="flex items-center gap-1.5 text-[9px] md:text-[11px] text-muted-foreground font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
                                                    <Building2 className="h-3 w-3 text-primary" />
                                                    {edition.publisher || 'Inconnu'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[9px] md:text-[11px] text-muted-foreground font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
                                                    <Globe className="h-3 w-3 text-primary" />
                                                    {(edition.language || 'FR').toUpperCase()}
                                                </div>
                                            </div>
                                        </Link>

                                        <div className="text-right flex-shrink-0">
                                            <div className="flex items-baseline gap-1.5 justify-end leading-none mb-1">
                                                <span className="text-3xl md:text-4xl font-display font-black text-white">{possessedCount}</span>
                                                {hasTotal && (
                                                    <span className="text-muted-foreground font-black text-xs md:text-sm">/ {total}</span>
                                                )}
                                            </div>
                                            <span className="text-[9px] md:text-[11px] text-muted-foreground font-black uppercase tracking-widest block">Tomes Possédés</span>
                                        </div>
                                    </div>

                                    {hasTotal && (
                                        <div className="space-y-2">
                                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    className="h-full bg-primary shadow-[0_0_15px_var(--color-primary)]"
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 mt-4">
                                    {!isReadOnly && (possessedCount === 0 || isWishlisted) && onAddToWishlist && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-10 w-10 rounded-xl border shadow-none transition-all",
                                                isWishlisted 
                                                    ? "bg-pink-500 text-white border-pink-500 hover:bg-pink-600 hover:text-white" 
                                                    : "bg-pink-500/10 text-pink-500 hover:bg-pink-500/20 hover:text-pink-500 border border-pink-500/20"
                                            )}
                                            onClick={() => onAddToWishlist(edition)}
                                            disabled={isAddingToWishlist === edition.id || isOffline}
                                            title={isWishlisted ? "Retirer de la wishlist" : "Ajouter à la wishlist"}
                                        >
                                            {isAddingToWishlist === edition.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
                                            )}
                                        </Button>
                                    )}

                                    {!isReadOnly && hasTotal && !isComplete && onAddAll && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-10 px-4 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border border-primary/20"
                                            onClick={() => onAddAll(edition)}
                                            disabled={isAddingAll === edition.id || isOffline}
                                        >
                                            {isAddingAll === edition.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Plus className="h-4 w-4 mr-2" />
                                            )}
                                            <span className="font-black uppercase tracking-widest text-[10px]">Tout ajouter</span>
                                        </Button>
                                    )}

                                    {!isReadOnly && volumes.length > 0 && volumes.some(v => !v.is_loaned) && onLoanEdition && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-400 border border-blue-500/20"
                                            onClick={() => {
                                                const unloaned = volumes.filter(v => !v.is_loaned);
                                                onLoanEdition(unloaned);
                                            }}
                                            disabled={isOffline}
                                            title="Prêter des tomes"
                                        >
                                            <ArrowLeftRight className="h-4 w-4" />
                                        </Button>
                                    )}

                                    <Button asChild variant="ghost" size="sm" className="h-10 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-none">
                                        <Link href={`${baseUrl}/edition/${edition.id}`}>
                                            <BookOpen className="h-4 w-4 mr-2" />
                                            <span className="font-black uppercase tracking-widest text-[10px]">Détails</span>
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}
