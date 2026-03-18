"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Plus, Trash2, X, Heart, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ActionToolbarProps {
    selectedCount: number;
    hasMissing: boolean;
    hasOwned: boolean;
    onAdd: () => void;
    onWishlist?: () => void;
    onLoan: () => void;
    onRemove: () => void;
    onCancel: () => void;
    isSaving?: boolean;
    isWishlistSaving?: boolean;
}

export function ActionToolbar({
    selectedCount,
    hasMissing,
    hasOwned,
    onAdd,
    onWishlist,
    onLoan,
    onRemove,
    onCancel,
    isSaving = false,
    isWishlistSaving = false
}: ActionToolbarProps) {
    if (selectedCount === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl"
            >
                <div className="premium-glass bg-card/90 border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={onCancel}
                            className="rounded-full hover:bg-white/10 text-muted-foreground"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                        <div className="flex flex-col">
                            <span className="text-sm font-display font-black text-white uppercase tracking-tight">
                                {selectedCount} {selectedCount > 1 ? 'Tomes sélectionnés' : 'Tome sélectionné'}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                                Actions groupées
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {hasMissing && (
                            <>
                                {onWishlist && (
                                    <Button
                                        onClick={onWishlist}
                                        disabled={isWishlistSaving}
                                        className="bg-pink-600 hover:bg-pink-500 text-white font-display font-black uppercase tracking-tight px-4 h-10 rounded-xl shadow-lg shadow-pink-500/20"
                                    >
                                        {isWishlistSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Heart className="mr-2 h-4 w-4" />}
                                        <span className="hidden sm:inline ml-2">Favoris</span>
                                    </Button>
                                )}
                                <Button
                                    onClick={onAdd}
                                    disabled={isSaving}
                                    className="bg-primary hover:bg-primary/90 text-white font-display font-black uppercase tracking-tight px-4 h-10 rounded-xl shadow-lg shadow-primary/20"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Ajouter
                                </Button>
                            </>
                        )}
                        {hasOwned && (
                            <>
                                <Button
                                    onClick={onLoan}
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-display font-black uppercase tracking-tight px-4 h-10 rounded-xl shadow-lg shadow-blue-500/20"
                                >
                                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                                    Prêter
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={onRemove}
                                    className="font-display font-black uppercase tracking-tight px-4 h-10 rounded-xl"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
