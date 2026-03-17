"use client";

import { GroupedSeries } from "@/types/manga";
import { User, Library } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { MangaCover } from "../ui/manga-cover";

interface SeriesListProps {
    seriesList: GroupedSeries[];
    baseUrl: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function SeriesList({ seriesList, baseUrl }: SeriesListProps) {
    return (
        <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
        >
            {seriesList.map(({ series, volumes }) => (
                <motion.div key={series.id} variants={item}>
                    <Link 
                        href={`${baseUrl}/series/${series.id}`} 
                        className="group relative block"
                    >
                        <div className="relative aspect-[2/3] w-full bg-card rounded-2xl overflow-hidden manga-panel transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 shadow-sm hover:shadow-2xl hover:shadow-primary/20">
                            <MangaCover 
                                src={series.cover_url} 
                                alt={series.title} 
                                title={series.title}
                                className="group-hover:scale-110"
                            />
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            <div className="absolute top-3 left-3 flex gap-2">
                                 <div className="px-2 py-1 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded shadow-lg">
                                    {volumes.length} Tome{volumes.length > 1 ? 's' : ''}
                                </div>
                            </div>

                            <div className="absolute top-3 right-3 p-2 bg-background/20 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Library className="h-4 w-4 text-white" />
                            </div>
                            
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                <div className="space-y-1 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                    <div className="flex items-center gap-1.5 text-[10px] text-primary font-black uppercase tracking-widest">
                                        <User className="h-3 w-3" />
                                        <span className="truncate">
                                            {series.authors && series.authors.length > 0 ? series.authors[0] : "Auteur inconnu"}
                                        </span>
                                    </div>
                                    <h3 className="text-white font-display font-black text-lg md:text-xl leading-tight line-clamp-2 uppercase tracking-tight drop-shadow-2xl">
                                        {series.title}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </Link>
                </motion.div>
            ))}
        </motion.div>
    );
}
