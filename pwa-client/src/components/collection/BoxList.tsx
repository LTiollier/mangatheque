"use client";

import { Series, BoxSet, Box } from "@/types/manga";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Check, Building2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface BoxListProps {
    series: Series;
    boxSets: BoxSet[];
    baseUrl: string;
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
    baseUrl
}: BoxListProps) {
    return (
        <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
            {boxSets.map((boxSet) => {
                const total = boxSet.boxes.length;
                const possessedCount = boxSet.boxes.filter(b => b.is_owned).length;
                const hasTotal = total > 0;
                const percentage = hasTotal ? Math.min(100, (possessedCount / total) * 100) : 0;
                const isComplete = hasTotal && possessedCount >= total;

                return (
                    <motion.div key={boxSet.id} variants={item}>
                        <Card className="premium-glass hover:bg-card/80 transition-all flex flex-col h-full rounded-2xl overflow-hidden border border-border/50 group">
                            <Link href={`${baseUrl}/box-set/${boxSet.id}`} className="flex-grow">
                                <CardHeader className="pb-3 border-b border-white/5 space-y-3">
                                    <CardTitle className="text-2xl font-display font-black uppercase tracking-tight text-white group-hover:text-primary transition-colors">
                                        {boxSet.title}
                                    </CardTitle>
                                    <div className="flex flex-wrap gap-3">
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                                            <Building2 className="h-3 w-3 text-primary" />
                                            {boxSet.publisher || 'Inconnu'}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-6">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <span className="text-4xl font-display font-black text-white">{possessedCount}</span>
                                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest ml-2">Coffrets Possédés</span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest bg-white/5 px-3 py-1 transparent-border rounded-full">
                                            Sur {total}
                                        </div>
                                    </div>

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
                                </CardContent>
                            </Link>

                            <div className="p-6 pt-0 space-y-3">
                                <Button asChild className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-none">
                                    <Link href={`${baseUrl}/box-set/${boxSet.id}`}>
                                        <Package className="h-4 w-4 mr-2" />
                                        <span className="font-display font-black text-lg uppercase tracking-tight">Voir les coffrets</span>
                                    </Link>
                                </Button>

                                {isComplete && total > 0 && (
                                    <div className="flex items-center justify-center gap-2 text-primary font-black uppercase tracking-widest text-xs py-3 bg-primary/5 rounded-xl border border-primary/20">
                                        <Check className="h-4 w-4" /> Intégrale Complète
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
