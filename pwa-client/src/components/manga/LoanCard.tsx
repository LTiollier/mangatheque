"use client";

import { Loan } from "@/types/manga";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ArrowLeftRight,
    Calendar,
    User,
    CheckCircle2,
    Circle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface LoanCardProps {
    loan: Loan;
    onReturn?: () => void;
    isSelectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: () => void;
}

export function LoanCard({
    loan,
    onReturn,
    isSelectionMode,
    isSelected,
    onToggleSelect,
}: LoanCardProps) {
    return (
        <Card
            className={`bg-slate-900/50 border-slate-800 overflow-hidden hover:border-purple-500/30 transition-all group ${isSelectionMode ? "cursor-pointer" : ""} ${isSelected ? "ring-2 ring-blue-500 border-blue-500/50" : ""}`}
            onClick={() => {
                if (isSelectionMode && onToggleSelect) {
                    onToggleSelect();
                }
            }}
        >
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start gap-2">
                    <Badge
                        variant={loan.is_returned ? "secondary" : "outline"}
                        className={loan.is_returned ? "bg-slate-800 text-slate-400" : "bg-purple-500/10 text-purple-400 border-purple-500/20"}
                    >
                        {loan.is_returned ? "Rendu" : "Prêté"}
                    </Badge>
                    <div className="flex items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(loan.loaned_at), "dd MMM yyyy", { locale: fr })}
                    </div>
                </div>
                <CardTitle className="text-lg font-bold group-hover:text-purple-400 transition-colors line-clamp-1">
                    {loan.volume?.title || `Volume #${loan.volume_id}`}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 font-bold text-slate-300">
                    <User className="h-4 w-4 text-purple-500" />
                    {loan.borrower_name}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {loan.notes && (
                    <p className="text-xs text-slate-400 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                        {loan.notes}
                    </p>
                )}

                {!loan.is_returned && onReturn && !isSelectionMode && (
                    <Button
                        onClick={onReturn}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl h-10 group/btn"
                    >
                        <CheckCircle2 className="mr-2 h-4 w-4 text-slate-400 group-hover/btn:text-green-500" />
                        Marquer comme rendu
                    </Button>
                )}

                {!loan.is_returned && isSelectionMode && (
                    <div className="flex items-center justify-center p-2 mt-4 bg-slate-950/30 rounded-xl border border-slate-800">
                        {isSelected ? (
                            <span className="flex items-center text-blue-400 font-bold">
                                <CheckCircle2 className="h-5 w-5 mr-2" /> Sélectionné
                            </span>
                        ) : (
                            <span className="flex items-center text-slate-500 font-bold">
                                <Circle className="h-5 w-5 mr-2" /> Sélectionner
                            </span>
                        )}
                    </div>
                )}

                {loan.is_returned && loan.returned_at && (
                    <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1 font-medium bg-slate-950/30 py-2 rounded-lg">
                        <ArrowLeftRight className="h-3 w-3" />
                        Rendu le {format(new Date(loan.returned_at), "dd MMMM yyyy", { locale: fr })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
