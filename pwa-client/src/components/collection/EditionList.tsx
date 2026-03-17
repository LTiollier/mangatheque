"use client";

import { Series, Edition, Manga } from "@/types/manga";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Check, Loader2, Plus, WifiOff, ArrowLeftRight, Building2, Globe } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

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
    isOffline?: boolean;
    onAddAll?: (edition: Edition, totalVolumes: number, possessedNumbers: Set<number>) => void;
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
    isOffline = false,
    onAddAll,
    onLoanEdition
}: EditionListProps) {
    return (
        <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
            {editionsList.map(({ edition, volumes }) => {
                const total = edition.total_volumes;
                const hasTotal = Boolean(total && total > 0);
                const possessedCount = volumes.length;
                const percentage = hasTotal && total ? Math.min(100, (possessedCount / total) * 100) : null;
                const possessedNumbers = new Set(volumes.map(v => parseInt(v.number || '0')).filter(n => !isNaN(n)));
                const isComplete = hasTotal && possessedCount >= (total || 0);

                return (
                    <motion.div key={edition.id} variants={item}>
                        <Card className="premium-glass hover:bg-card/80 transition-all flex flex-col h-full rounded-2xl overflow-hidden border border-border/50 group">
                            <Link href={`${baseUrl}/edition/${edition.id}`} className="flex-grow">
                                <CardHeader className="pb-3 border-b border-white/5 space-y-3">
                                    <CardTitle className="text-2xl font-display font-black uppercase tracking-tight text-white group-hover:text-primary transition-colors">
                                        {edition.name}
                                    </CardTitle>
                                    <div className="flex flex-wrap gap-3">
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                                            <Building2 className="h-3 w-3 text-primary" />
                                            {edition.publisher || 'Inconnu'}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                                            <Globe className="h-3 w-3 text-primary" />
                                            {(edition.language || 'FR').toUpperCase()}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-6">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <span className="text-4xl font-display font-black text-white">{possessedCount}</span>
                                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest ml-2">Possédés</span>
                                        </div>
                                        {hasTotal && (
                                            <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest bg-white/5 px-3 py-1 transparent-border rounded-full">
                                                Sur {total}
                                            </div>
                                        )}
                                    </div>

                                    {hasTotal && (
                                        <div className="space-y-2">
                                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    className="h-full bg-primary shadow-[0_0_10px_var(--color-primary)]"
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Link>

                            <div className="p-6 pt-0 space-y-3">
                                <Button asChild className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-none">
                                    <Link href={`${baseUrl}/edition/${edition.id}`}>
                                        <BookOpen className="h-4 w-4" />
                                        <span className="font-display font-black text-lg uppercase tracking-tight">Voir les tomes</span>
                                    </Link>
                                </Button>

                                {!isReadOnly && hasTotal && !isComplete && onAddAll && (
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 rounded-xl border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/40 font-black uppercase tracking-widest text-xs"
                                        onClick={() => onAddAll(edition, total || 0, possessedNumbers)}
                                        disabled={isAddingAll === edition.id || isOffline}
                                    >
                                        {isAddingAll === edition.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : isOffline ? (
                                            <WifiOff className="h-4 w-4 mr-2" />
                                        ) : (
                                            <Plus className="h-4 w-4 mr-2" />
                                        )}
                                        {isOffline ? "HORS LIGNE" : `TOUT AJOUTER (${(total || 0) - possessedCount})`}
                                    </Button>
                                )}

                                {!isReadOnly && volumes.length > 0 && volumes.some(v => !v.is_loaned) && onLoanEdition && (
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 rounded-xl border-blue-500/20 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/40 font-black uppercase tracking-widest text-xs"
                                        onClick={() => {
                                            const unloaned = volumes.filter(v => !v.is_loaned);
                                            onLoanEdition(unloaned);
                                        }}
                                        disabled={isOffline}
                                    >
                                        <ArrowLeftRight className="h-4 w-4 mr-2" />
                                        PRÊTER ({volumes.filter(v => !v.is_loaned).length})
                                    </Button>
                                )}

                                {isComplete && (
                                    <div className="flex items-center justify-center gap-2 text-primary font-black uppercase tracking-widest text-xs py-3 bg-primary/5 rounded-xl border border-primary/20">
                                        <Check className="h-4 w-4" /> Collection Complète
                                    </div>
                                )}
                            </div>
                        </Card>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}
