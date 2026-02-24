"use client";

import { Manga } from "@/types/manga";
import Image from "next/image";
import { ArrowLeftRight, Check, CheckCircle2, Circle } from "lucide-react";

interface VolumeUI {
    id?: number;
    number: number;
    isPossessed: boolean;
    cover_url: string | null;
    manga: Manga | null;
}

interface VolumeListProps {
    volumesUI: VolumeUI[];
    isReadOnly?: boolean;
    selectedMissing?: number[];
    selectedMangaForLoan?: Manga[];
    onVolumeClick?: (vol: VolumeUI) => void;
    onLoanClick?: (vol: VolumeUI) => void;
}

export function VolumeGrid({
    volumesUI,
    isReadOnly = false,
    selectedMissing = [],
    selectedMangaForLoan = [],
    onVolumeClick,
    onLoanClick
}: VolumeListProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {volumesUI.map((vol) => {
                const isSelected = selectedMissing.includes(vol.number);
                const isLoanSelected = selectedMangaForLoan.some(m => m.id === vol.manga?.id);

                return (
                    <div
                        key={vol.number}
                        onClick={() => !isReadOnly && onVolumeClick?.(vol)}
                        className={`
                            relative aspect-[2/3] rounded-xl overflow-hidden transition-all duration-300
                            ${!isReadOnly ? 'cursor-pointer' : ''}
                            ${vol.isPossessed ? (isLoanSelected ? 'ring-4 ring-blue-500 scale-95' : 'ring-2 ring-purple-500 border-none') : (!isReadOnly ? 'hover:scale-105' : '')}
                            ${isSelected && !vol.isPossessed ? 'ring-4 ring-blue-500 scale-95' : ''}
                            ${!vol.isPossessed && !isSelected ? 'opacity-50 grayscale border-2 border-dashed border-slate-600' : ''}
                        `}
                    >
                        {vol.cover_url ? (
                            <Image src={vol.cover_url} alt={`Volume ${vol.number}`} fill className="object-cover" unoptimized />
                        ) : (
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 text-sm">
                                Tome {vol.number}
                            </div>
                        )}

                        <div className="absolute top-0 inset-x-0 p-2 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start">
                            <span className="px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-md font-bold text-sm text-white">
                                #{vol.number}
                            </span>
                        </div>

                        {/* Missing volume placeholder/selection indicator */}
                        {!vol.isPossessed && !isReadOnly && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                {isSelected ? (
                                    <div className="bg-blue-500 text-white rounded-full p-1 animate-in zoom-in">
                                        <CheckCircle2 className="h-8 w-8" />
                                    </div>
                                ) : (
                                    <div className="bg-black/40 text-white rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity">
                                        <Circle className="h-8 w-8" />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Loan button for possessed but not loaned manga */}
                        {vol.isPossessed && !vol.manga?.is_loaned && !isReadOnly && (
                            <div
                                className={`absolute bottom-2 left-2 ${isLoanSelected ? 'bg-blue-600 text-white' : 'bg-slate-900/90 text-purple-400'} rounded-full p-2 shadow-lg hover:bg-blue-600 hover:text-white transition-colors cursor-pointer border ${isLoanSelected ? 'border-blue-500' : 'border-purple-500/20'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onLoanClick?.(vol);
                                }}
                            >
                                <ArrowLeftRight className="h-4 w-4" />
                            </div>
                        )}

                        {/* Status icon (possessed or loaned) */}
                        {vol.isPossessed && (
                            <div className={`absolute bottom-2 right-2 ${vol.manga?.is_loaned ? 'bg-orange-500' : 'bg-purple-600'} text-white rounded-full p-1 shadow-lg`}>
                                {vol.manga?.is_loaned ? <ArrowLeftRight className="h-4 w-4" /> : isLoanSelected ? <CheckCircle2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                            </div>
                        )}

                        {/* Loan overlay */}
                        {vol.manga?.is_loaned && (
                            <div className="absolute inset-0 bg-orange-500/10 backdrop-blur-[1px] flex items-center justify-center">
                                <div className="bg-orange-500 text-white px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter shadow-xl">
                                    Prêté {vol.manga.loaned_to ? `à ${vol.manga.loaned_to}` : ''}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
