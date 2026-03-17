"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, User, BookOpen, Package } from 'lucide-react';
import { Series, Edition, Manga } from '@/types/manga';
import { Button } from '@/components/ui/button';
import { MangaCover } from '@/components/ui/manga-cover';
import { EditionList } from '@/components/collection/EditionList';
import { BoxList } from '@/components/collection/BoxList';

interface EditionGroup {
    edition: Edition;
    volumes: Manga[];
}

interface SeriesDetailViewProps {
    series: Series;
    volumes: Manga[];
    editionsList: EditionGroup[];
    baseUrl: string;
    backLink: string;
    backLabel: string;
    heroActions?: React.ReactNode;
    isAddingAll?: number | null;
    isOffline?: boolean;
    isReadOnly?: boolean;
    onAddAll?: (edition: Edition, total: number, numbers: Set<number>) => void;
    onLoanEdition?: (volumes: Manga[]) => void;
    editionsTitle?: string;
}

export function SeriesDetailView({
    series,
    editionsList,
    baseUrl,
    backLink,
    backLabel,
    heroActions,
    isAddingAll,
    isOffline = false,
    isReadOnly = false,
    onAddAll,
    onLoanEdition,
    editionsTitle = "Éditions disponibles"
}: SeriesDetailViewProps) {
    const possessedTotal = series.editions?.reduce((acc, ed) => acc + (ed.possessed_count || 0), 0) || 0;
    const totalPossible = series.editions?.reduce((acc, ed) => acc + (ed.total_volumes || 0), 0) || 0;

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-white group -ml-2">
                <Link href={backLink}>
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
                    <span className="font-black uppercase tracking-widest text-xs">{backLabel}</span>
                </Link>
            </Button>

            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 border border-white/5 shadow-2xl group/hero">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(var(--color-primary-rgb),0.1),transparent)]" />

                <div className="relative flex flex-col md:flex-row gap-6 lg:gap-10 p-6 md:p-8 items-center md:items-start text-center md:text-left">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 0.6 }}
                        className="relative w-40 h-60 md:w-48 md:h-72 flex-shrink-0 rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-10"
                    >
                        <MangaCover 
                            src={series.cover_url} 
                            alt={series.title} 
                            title={series.title}
                            priority 
                            className="transition-transform duration-700 group-hover/hero:scale-105"
                        />
                    </motion.div>
 
                    <div className="flex-1 space-y-6 pt-2 relative z-10">
                        <div className="space-y-3">
                            <motion.h1 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-4xl md:text-5xl lg:text-6xl font-display font-black leading-[1] uppercase tracking-tighter text-white drop-shadow-sm"
                            >
                                {series.title}
                            </motion.h1>
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex items-center justify-center md:justify-start gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px] md:text-xs"
                            >
                                <User className="h-3 w-3 md:h-4 w-4" />
                                {series.authors ? series.authors.join(', ') : 'Auteurs inconnus'}
                            </motion.div>
                        </div>

                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-wrap gap-3 justify-center md:justify-start pt-2"
                        >
                            <div className="flex flex-col px-4 py-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                                <span className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Total Possédés</span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xl md:text-2xl font-display font-black text-white">{possessedTotal}</span>
                                    <span className="text-slate-600 font-black text-[10px]">/ {totalPossible} tomes</span>
                                </div>
                            </div>

                            <div className="flex flex-col px-4 py-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                                <span className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Éditions</span>
                                <span className="text-xl md:text-2xl font-display font-black text-primary">{series.editions?.length || 0}</span>
                            </div>

                            {heroActions && (
                                <div className="flex items-center">
                                    {heroActions}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Editions Section */}
            <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h2 className="text-3xl font-display font-black flex items-center gap-3 uppercase tracking-tight text-white">
                        < BookOpen className="h-8 w-8 text-primary" />
                        {editionsTitle}
                    </h2>
                </div>

                <EditionList
                    series={series}
                    editionsList={editionsList}
                    baseUrl={baseUrl}
                    isAddingAll={isAddingAll}
                    isOffline={isOffline}
                    isReadOnly={isReadOnly}
                    onAddAll={onAddAll}
                    onLoanEdition={onLoanEdition}
                />
            </div>

            {/* Box Sets Section */}
            {series.box_sets && series.box_sets.length > 0 && (
                <div className="space-y-8">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <Package className="h-8 w-8 text-primary" />
                        <h2 className="text-3xl font-display font-black uppercase tracking-tight text-white">
                            Coffrets & Intégrales
                        </h2>
                    </div>

                    <BoxList
                        series={series}
                        boxSets={series.box_sets}
                        baseUrl={baseUrl}
                    />
                </div>
            )}
        </div>
    );
}
