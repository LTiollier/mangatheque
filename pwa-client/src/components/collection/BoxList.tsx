"use client";

import { Series, BoxSet } from "@/types/manga";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Check, Building2, Heart, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import { MangaCover } from "@/components/ui/manga-cover";

interface BoxListProps {
    series: Series;
    boxSets: BoxSet[];
    baseUrl: string;
    isReadOnly?: boolean;
    isAddingAll?: number | null;
    isAddingToWishlist?: number | null;
    isOffline?: boolean;
    onAddAll?: (boxSet: BoxSet) => void;
    onAddToWishlist?: (boxSet: BoxSet) => void;
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

export function BoxList({
    series,
    boxSets,
    baseUrl,
    isReadOnly = false,
    isAddingAll = null,
    isAddingToWishlist = null,
    isOffline = false,
    onAddAll,
    onAddToWishlist
}: BoxListProps) {
    return (
        <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-6"
        >
            {boxSets.map((boxSet) => {
                const total = boxSet.boxes.length;
                const possessedCount = boxSet.boxes.filter(b => b.is_owned).length;
                const hasTotal = total > 0;
                const percentage = hasTotal ? Math.min(100, (possessedCount / total) * 100) : 0;
                const isComplete = hasTotal && possessedCount >= total;

                // On considère le boxSet en wishlist si au moins un des coffrets (non possédés) y est
                // ou si le flag global is_wishlisted est présent (ex: boxSet ajouté directement)
                const isWishlisted = boxSet.is_wishlisted || boxSet.boxes.some(b => !b.is_owned && b.is_wishlisted);

                // Use box set cover if available, otherwise first box's cover, otherwise series cover
                const coverUrl = boxSet.cover_url || boxSet.boxes[0]?.cover_url || series.cover_url;

                return (
                    <motion.div key={boxSet.id} variants={item}>
                        <Card className="premium-glass hover:bg-card/80 transition-all rounded-[1.5rem] overflow-hidden border border-border/50 group flex flex-row min-h-[10rem] md:min-h-[12rem]">
                            {/* Left Side: Cover Image */}
                            <Link href={`${baseUrl}/box-set/${boxSet.id}`} className="relative w-28 md:w-32 flex-shrink-0 min-h-[10rem] md:min-h-[12rem] aspect-[2/3] overflow-hidden border-r border-white/5">
                                <MangaCover 
                                    src={coverUrl} 
                                    alt={boxSet.title} 
                                    title={boxSet.title}
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
                                        <Link href={`${baseUrl}/box-set/${boxSet.id}`} className="flex-1 min-w-0">
                                            <CardTitle className="text-2xl md:text-3xl font-display font-black uppercase tracking-tight text-white group-hover:text-primary transition-colors line-clamp-1 leading-none">
                                                {boxSet.title}
                                            </CardTitle>
                                            <div className="flex gap-3 mt-3">
                                                <div className="flex items-center gap-1.5 text-[9px] md:text-[11px] text-muted-foreground font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
                                                    <Building2 className="h-3 w-3 text-primary" />
                                                    {boxSet.publisher || 'Inconnu'}
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
                                            <span className="text-[9px] md:text-[11px] text-muted-foreground font-black uppercase tracking-widest block">Coffrets Possédés</span>
                                        </div>
                                    </div>

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
                                            onClick={() => onAddToWishlist(boxSet)}
                                            disabled={isAddingToWishlist === boxSet.id || isOffline}
                                            title={isWishlisted ? "Retirer de la wishlist" : "Ajouter à la wishlist"}
                                        >
                                            {isAddingToWishlist === boxSet.id ? (
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
                                            onClick={() => onAddAll(boxSet)}
                                            disabled={isAddingAll === boxSet.id || isOffline}
                                        >
                                            {isAddingAll === boxSet.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Plus className="h-4 w-4 mr-2" />
                                            )}
                                            <span className="font-black uppercase tracking-widest text-[10px]">Tout ajouter</span>
                                        </Button>
                                    )}

                                    <Button asChild variant="ghost" size="sm" className="h-10 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-none">
                                        <Link href={`${baseUrl}/box-set/${boxSet.id}`}>
                                            <Package className="h-4 w-4 mr-2" />
                                            <span className="font-black uppercase tracking-widest text-[10px]">Voir les coffrets</span>
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
