"use client";

import { GroupedSeries } from "@/types/manga";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Layers } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface SeriesListProps {
    seriesList: GroupedSeries[];
    baseUrl: string; // e.g. "/collection" or "/user/leoelmy/collection"
}

export function SeriesList({ seriesList, baseUrl }: SeriesListProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {seriesList.map(({ series, volumes }) => (
                <Card key={series.id} className="overflow-hidden flex flex-col h-full bg-slate-900 border-slate-800 hover:border-purple-500/50 transition-all duration-300 group">
                    <Link href={`${baseUrl}/series/${series.id}`} className="flex-grow flex flex-col">
                        <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-800">
                            {series.cover_url ? (
                                <Image
                                    src={series.cover_url}
                                    alt={series.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    unoptimized
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-600 italic text-sm text-center px-4">
                                    Pas de couverture
                                </div>
                            )}
                            <div className="absolute top-2 right-2 bg-purple-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg">
                                {volumes.length} Tome{volumes.length > 1 ? 's' : ''}
                            </div>
                        </div>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-lg line-clamp-1 group-hover:text-purple-400 transition-colors text-slate-100">
                                {series.title}
                            </CardTitle>
                            <p className="text-sm text-slate-500 line-clamp-1">
                                {series.authors && series.authors.length > 0 ? series.authors.join(", ") : "Auteur inconnu"}
                            </p>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                <Layers className="h-3 w-3" />
                                <span>
                                    {Array.from(new Set(volumes.map(v => v.edition?.name).filter(Boolean))).join(', ') || 'Édition Standard'}
                                </span>
                            </div>
                        </CardContent>
                    </Link>
                </Card>
            ))}
        </div>
    );
}
