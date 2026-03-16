"use client";

import { Manga } from "@/types/manga";
import { MangaCover } from "../ui/manga-cover";
import { ArrowLeftRight, CheckCircle2, Circle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
    selectedIds: number[]; // Consistent identification (e.g. volume number for missing, manga id for possessed)
    onVolumeToggle: (vol: VolumeUI) => void;
}

export function VolumeGrid({
    volumesUI,
    isReadOnly = false,
    selectedIds = [],
    onVolumeToggle,
}: VolumeListProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {volumesUI.map((vol, index) => {
                const uniqueId = vol.isPossessed ? (vol.manga?.id ?? -vol.number) : vol.number;
                const isSelected = selectedIds.includes(uniqueId);
                const isLoaned = vol.manga?.is_loaned;

                return (
                    <motion.div
                        key={vol.number}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => !isReadOnly && onVolumeToggle(vol)}
                        className={cn(
                            "relative aspect-[2/3] rounded-2xl overflow-hidden transition-all duration-300 manga-panel group select-none",
                            !isReadOnly && "cursor-pointer active:scale-95",
                            vol.isPossessed 
                                ? (isSelected ? 'ring-4 ring-primary ring-offset-4 ring-offset-background z-10' : 'border border-border/50 shadow-lg') 
                                : (isSelected ? 'ring-4 ring-primary opacity-100 z-10' : 'border-2 border-dashed border-border/20 bg-secondary/5 opacity-40 hover:opacity-100'),
                            isLoaned && !isSelected && "ring-0"
                        )}
                    >
                        <MangaCover 
                            src={vol.cover_url} 
                            alt={`Volume ${vol.number}`} 
                            title={vol.manga?.title || undefined}
                            volumeNumber={vol.number}
                            className={cn(
                                !vol.isPossessed && "grayscale opacity-20 contrast-[0.8]",
                                isSelected && "scale-105"
                            )}
                        />

                        {/* Top Badge: Number */}
                        <div className="absolute top-2 left-2 z-20">
                            <span className={cn(
                                "px-2 py-0.5 rounded font-display font-black text-[10px] uppercase tracking-tighter shadow-xl transition-colors",
                                isSelected ? "bg-white text-black" : "bg-primary text-white"
                            )}>
                                #{vol.number}
                            </span>
                        </div>

                        {/* Selection Checkbox Replacement (Icon centered) */}
                        <div className={cn(
                            "absolute inset-0 flex items-center justify-center transition-all duration-300 z-30 pointer-events-none",
                            isSelected ? "bg-primary/20 backdrop-blur-[2px] opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}>
                            {isSelected ? (
                                <div className="bg-white text-primary rounded-full p-2 shadow-2xl scale-110">
                                    <CheckCircle2 className="h-8 w-8" />
                                </div>
                            ) : !isReadOnly && (
                                <div className="bg-black/40 backdrop-blur-sm text-white rounded-full p-2 border border-white/20">
                                    {vol.isPossessed ? <Circle className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                                </div>
                            )}
                        </div>

                        {/* Loan Status & Overlay */}
                        {isLoaned && (
                            <div className="absolute inset-0 bg-orange-500/10 backdrop-blur-[1px] flex flex-col items-center justify-end p-3 z-20">
                                <div className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-2xl border border-white/20 text-center leading-tight">
                                    <ArrowLeftRight className="h-3 w-3 inline mr-1 mb-0.5" />
                                    Prêté {vol.manga?.loaned_to ? `à ${vol.manga.loaned_to}` : ''}
                                </div>
                            </div>
                        )}
                        
                        {!isLoaned && vol.isPossessed && !isSelected && (
                             <div className="absolute bottom-2 right-2 z-20">
                                <div className="bg-primary/20 backdrop-blur-md p-1.5 rounded-lg border border-primary/20">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                                </div>
                             </div>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}
