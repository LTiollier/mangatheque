"use client";

import { Series, BoxSet } from "@/types/manga";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Check, Building2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MangaCover } from "@/components/ui/manga-cover";

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
            {boxSets.map((boxSet) => (
                <motion.div key={boxSet.id} variants={item}>
                    <Card className="premium-glass flex flex-col h-full rounded-[2rem] overflow-hidden border border-border/50 group">
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
                        
                        <CardContent className="space-y-4 pt-6 flex-grow">
                            <div className="space-y-3">
                                {boxSet.boxes.map(box => (
                                    <Link 
                                        key={box.id} 
                                        href={`${baseUrl}/box/${box.id}`}
                                        className="flex gap-4 p-3 bg-white/[0.02] rounded-2xl border border-white/5 items-center hover:bg-white/5 transition-colors group/boxitem"
                                    >
                                        <div className="relative w-12 h-18 rounded-lg overflow-hidden flex-shrink-0">
                                            <MangaCover src={box.cover_url} alt={box.title} title={box.title} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate uppercase group-hover/boxitem:text-primary transition-colors">{box.title}</p>
                                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">
                                                ISBN: {box.isbn || 'N/A'}
                                            </p>
                                        </div>
                                        {box.is_owned ? (
                                            <div className="px-2 py-1 rounded-md bg-primary/10 text-[8px] font-black uppercase text-primary font-bold flex items-center gap-1">
                                                <Check className="h-2 w-2" /> Possédé
                                            </div>
                                        ) : box.is_empty ? (
                                            <div className="px-2 py-1 rounded-md bg-white/5 text-[8px] font-black uppercase text-slate-500 font-bold">Vide</div>
                                        ) : (
                                            <div className="px-2 py-1 rounded-md bg-white/5 text-[8px] font-black uppercase text-slate-400 font-bold">Incomplet</div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </CardContent>

                        <div className="p-6 pt-0">
                            {boxSet.boxes.length > 0 ? (
                                <Button asChild className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-none">
                                    <Link href={`${baseUrl}/box/${boxSet.boxes[0].id}`}>
                                        <Package className="h-4 w-4 mr-2" />
                                        <span className="font-display font-black text-lg uppercase tracking-tight">Détails Coffret</span>
                                    </Link>
                                </Button>
                            ) : (
                                <Button disabled className="w-full h-12 rounded-xl bg-white/5 text-white/50 border border-white/10 shadow-none">
                                    <Package className="h-4 w-4 mr-2" />
                                    <span className="font-display font-black text-lg uppercase tracking-tight">Aucun Coffret</span>
                                </Button>
                            )}
                        </div>
                    </Card>
                </motion.div>
            ))}
        </motion.div>
    );
}
