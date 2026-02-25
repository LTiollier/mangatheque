"use client";

import { Series, Edition, Manga } from "@/types/manga";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Check, Loader2, Plus, WifiOff, ArrowLeftRight } from "lucide-react";
import Link from "next/link";

interface EditionGroup {
    edition: Edition;
    volumes: Manga[];
}

interface EditionListProps {
    series: Series;
    editionsList: EditionGroup[];
    baseUrl: string; // e.g. "/collection/series/1"
    isReadOnly?: boolean;
    isAddingAll?: number | null;
    isOffline?: boolean;
    onAddAll?: (edition: Edition, totalVolumes: number, possessedNumbers: Set<number>) => void;
    onLoanEdition?: (volumes: Manga[]) => void;
}

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {editionsList.map(({ edition, volumes }) => {
                const total = edition.total_volumes || series.total_volumes;
                const hasTotal = Boolean(total && total > 0);
                const possessedCount = volumes.length;
                const percentage = hasTotal && total ? Math.min(100, (possessedCount / total) * 100) : null;
                const possessedNumbers = new Set(volumes.map(v => parseInt(v.number || '0')).filter(n => !isNaN(n)));
                const isComplete = hasTotal && possessedCount >= (total || 0);

                return (
                    <Card key={edition.id} className="bg-slate-900 border-slate-800 hover:border-purple-500/50 transition-all flex flex-col">
                        <Link href={`${baseUrl}/edition/${edition.id}`} className="flex-grow">
                            <CardHeader className="pb-3 text-slate-100">
                                <CardTitle className="text-xl">{edition.name}</CardTitle>
                                <div className="text-sm text-slate-500">
                                    {edition.publisher || 'Éditeur inconnu'} • {(edition.language || 'FR').toUpperCase()}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-end text-sm">
                                    <div>
                                        <span className="text-2xl font-bold text-white">{possessedCount}</span>
                                        <span className="text-slate-400"> tomes possédés</span>
                                    </div>
                                    {hasTotal && (
                                        <div className="text-slate-500">
                                            sur {total}
                                        </div>
                                    )}
                                </div>

                                {hasTotal && (
                                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-1000"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Link>

                        <div className="p-4 pt-0 space-y-2">
                            <Button asChild className="w-full bg-slate-800 hover:bg-slate-700 text-purple-400">
                                <Link href={`${baseUrl}/edition/${edition.id}`}>
                                    <BookOpen className="mr-2 h-4 w-4" /> Voir les tomes
                                </Link>
                            </Button>

                            {!isReadOnly && hasTotal && !isComplete && onAddAll && (
                                <Button
                                    variant="outline"
                                    className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                                    onClick={() => onAddAll(edition, total || 0, possessedNumbers)}
                                    disabled={isAddingAll === edition.id || isOffline}
                                >
                                    {isAddingAll === edition.id ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : isOffline ? (
                                        <WifiOff className="h-4 w-4 mr-2" />
                                    ) : (
                                        <Plus className="h-4 w-4 mr-2" />
                                    )}
                                    {isOffline ? "Hors ligne" : `Tout ajouter (${(total || 0) - possessedCount})`}
                                </Button>
                            )}

                            {!isReadOnly && volumes.length > 0 && volumes.some(v => !v.is_loaned) && onLoanEdition && (
                                <Button
                                    variant="outline"
                                    className="w-full border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                                    onClick={() => {
                                        const unloaned = volumes.filter(v => !v.is_loaned);
                                        onLoanEdition(unloaned);
                                    }}
                                    disabled={isOffline}
                                >
                                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                                    Prêter l&apos;édition ({volumes.filter(v => !v.is_loaned).length})
                                </Button>
                            )}

                            {isComplete && (
                                <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-bold py-2 bg-green-500/10 rounded-lg">
                                    <Check className="h-4 w-4" /> Collection complète
                                </div>
                            )}
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
