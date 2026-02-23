"use client";

import { useState } from "react";
import axios from "axios";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { Manga } from "@/types/manga";
import { toast } from "sonner";

interface LoanDialogProps {
    mangas: Manga[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function LoanDialog({ mangas, open, onOpenChange, onSuccess }: LoanDialogProps) {
    const [borrowerName, setBorrowerName] = useState("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mangas || mangas.length === 0) return;

        try {
            setIsSubmitting(true);
            await Promise.all(mangas.map(manga =>
                api.post("/loans", {
                    volume_id: manga.id,
                    borrower_name: borrowerName,
                    notes: notes || null
                })
            ));

            toast.success(`${mangas.length > 1 ? 'Mangas prêtés' : 'Manga prêté'} à ${borrowerName}`);
            onOpenChange(false);
            setBorrowerName("");
            setNotes("");
            onSuccess?.();
        } catch (error) {
            let message = "Erreur lors de la déclaration du prêt";
            if (axios.isAxiosError(error)) {
                message = error.response?.data?.message || message;
            }
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-slate-50">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl font-black italic">
                            <ArrowLeftRight className="h-6 w-6 text-purple-500" />
                            PRÊTER CE MANGA
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium">
                            Déclarez à qui vous prêtez {mangas.length > 1 ? <span className="text-slate-200 font-bold">{mangas.length} tomes</span> : <span className="text-slate-200 font-bold">&quot;{mangas[0]?.title}&quot;</span>}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-6">
                        <div className="space-y-2">
                            <Label htmlFor="borrower" className="text-xs font-black uppercase tracking-widest text-slate-500">
                                Nom de l&apos;emprunteur
                            </Label>
                            <Input
                                id="borrower"
                                placeholder="ex: Jean Dupont"
                                value={borrowerName}
                                onChange={(e) => setBorrowerName(e.target.value)}
                                className="bg-slate-950 border-slate-800 focus:border-purple-500 transition-colors h-12 rounded-xl font-bold"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-xs font-black uppercase tracking-widest text-slate-500">
                                Notes (optionnel)
                            </Label>
                            <Textarea
                                id="notes"
                                placeholder="ex: Prêté pour les vacances..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="bg-slate-950 border-slate-800 focus:border-purple-500 transition-colors rounded-xl font-medium min-h-[100px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !borrowerName}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
                        >
                            {isSubmitting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validation...</>
                            ) : "Valider le prêt"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
