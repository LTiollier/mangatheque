"use client";

import { useState, useMemo } from "react";
import {
    Search,
    BookOpen,
    CheckCircle2,
    History,
    Package,
    User,
    Loader2,
} from "lucide-react";
import { Loan, Manga, Box } from "@/types/manga";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLoansQuery, useReturnLoan, useBulkReturnLoans } from "@/hooks/queries";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type SelectionItem = { id: number, type: 'volume' | 'box' };

export default function LoansPage() {
    const { data: loans = [], isLoading } = useLoansQuery();
    const returnLoan = useReturnLoan();
    const bulkReturn = useBulkReturnLoans();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedItems, setSelectedItems] = useState<SelectionItem[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    const handleBulkReturnWithLoading = async () => {
        if (selectedItems.length === 0) return;
        await bulkReturn.mutateAsync(selectedItems);
        setSelectedItems([]);
        setIsSelectionMode(false);
    };

    const isItemSelected = (id: number, type: 'volume' | 'box') => {
        return selectedItems.some(item => item.id === id && item.type === type);
    };

    const toggleSelection = (id: number, type: 'volume' | 'box') => {
        setSelectedItems(prev =>
            isItemSelected(id, type) 
                ? prev.filter(item => !(item.id === id && item.type === type)) 
                : [...prev, { id, type }]
        );
    };

    const filteredLoans = useMemo(() => loans.filter(loan => {
        const borrowerMatch = loan.borrower_name.toLowerCase().includes(searchQuery.toLowerCase());
        const loanable = loan.loanable;
        let titleMatch = false;
        
        if (loanable) {
            titleMatch = loanable.title.toLowerCase().includes(searchQuery.toLowerCase());
            if (!titleMatch && 'series' in loanable && (loanable as Manga).series) {
                titleMatch = (loanable as Manga).series!.title.toLowerCase().includes(searchQuery.toLowerCase());
            } else if (!titleMatch && 'box_set' in loanable && (loanable as Box).box_set?.series) {
                titleMatch = (loanable as Box).box_set!.series!.title.toLowerCase().includes(searchQuery.toLowerCase());
            }
        }
        
        return borrowerMatch || titleMatch;
    }), [loans, searchQuery]);

    const activeLoans = useMemo(() => filteredLoans.filter(loan => !loan.is_returned), [filteredLoans]);
    const pastLoans = useMemo(() => filteredLoans.filter(loan => loan.is_returned), [filteredLoans]);

    const groupByItem = (loansArray: Loan[]) => {
        const groups = loansArray.reduce((acc, loan) => {
            const loanable = loan.loanable;
            let seriesName = "Série Inconnue";
            let itemName = "Édition Inconnue";
            let type: "box" | "edition" = "edition";

            if (loanable) {
                if (loan.loanable_type === 'volume') {
                    const manga = loanable as Manga;
                    seriesName = manga.series?.title || "Série Inconnue";
                    itemName = manga.edition?.name || "Édition Inconnue";
                    type = "edition";
                } else {
                    const box = loanable as Box;
                    seriesName = box.box_set?.series?.title || "Coffret";
                    itemName = box.title;
                    type = "box";
                }
            }
            
            const groupKey = `${seriesName} | ${itemName}`;

            if (!acc[groupKey]) {
                acc[groupKey] = {
                    series: seriesName,
                    item: itemName,
                    type: type,
                    loans: []
                };
            }
            acc[groupKey].loans.push(loan);
            return acc;
        }, {} as Record<string, { series: string, item: string, type: "box" | "edition", loans: Loan[] }>);

        return Object.values(groups).sort((a, b) => a.series.localeCompare(b.series));
    };

    const groupedActiveLoans = useMemo(() => groupByItem(activeLoans), [activeLoans]);
    const groupedPastLoans = useMemo(() => groupByItem(pastLoans), [pastLoans]);

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section Minimaliste */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-white uppercase">
                        Prêts
                    </h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                        Suivi des volumes empruntés
                    </p>
                </div>

                <div className="relative w-full md:w-72 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <Input
                        placeholder="Rechercher..."
                        className="pl-9 h-10 bg-slate-900/50 border-slate-800 rounded-lg text-sm focus:ring-primary/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <Tabs defaultValue="active" className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                    <TabsList className="bg-slate-900/50 border border-slate-800/50 p-1 rounded-2xl h-14 w-full sm:w-auto self-start">
                        <TabsTrigger 
                            value="active" 
                            className="rounded-xl px-8 font-black uppercase tracking-widest text-[11px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all h-full gap-3 group"
                        >
                            En cours
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-500 group-data-[state=active]:bg-primary/20 group-data-[state=active]:text-primary text-[10px] transition-colors">
                                {activeLoans.length}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="past" 
                            className="rounded-xl px-8 font-black uppercase tracking-widest text-[11px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all h-full gap-3 group"
                        >
                            Historique
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-500 group-data-[state=active]:bg-primary/20 group-data-[state=active]:text-primary text-[10px] transition-colors">
                                {pastLoans.length}
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    {activeLoans.length > 0 && (
                        <div className="flex items-center gap-2 bg-slate-900/30 p-1.5 rounded-xl border border-slate-800/50">
                            <button
                                className={`h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                    isSelectionMode 
                                        ? "bg-slate-800 text-white" 
                                        : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                                }`}
                                onClick={() => {
                                    setIsSelectionMode(!isSelectionMode);
                                    setSelectedItems([]);
                                }}
                            >
                                {isSelectionMode ? "Annuler" : "Multi-sélection"}
                            </button>
                            {isSelectionMode && selectedItems.length > 0 && (
                                <button
                                    className="h-9 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-all flex items-center gap-2"
                                    onClick={handleBulkReturnWithLoading}
                                    disabled={bulkReturn.isPending}
                                >
                                    {bulkReturn.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                    Rendu ({selectedItems.length})
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <TabsContent value="active" className="outline-none">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 rounded-xl bg-slate-900/50 animate-pulse border border-slate-800/50" />
                            ))}
                        </div>
                    ) : groupedActiveLoans.length > 0 ? (
                        <div className="space-y-10">
                            {groupedActiveLoans.map((group) => (
                                <div key={`${group.series}-${group.item}`} className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        {group.type === "box" ? (
                                            <Package className="h-4 w-4 text-primary" />
                                        ) : (
                                            <BookOpen className="h-4 w-4 text-blue-400" />
                                        )}
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-sm font-black uppercase tracking-tight text-white">{group.series}</span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">— {group.item}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-2">
                                        {group.loans.map((loan) => (
                                            <div 
                                                key={loan.id}
                                                onClick={() => isSelectionMode && toggleSelection(loan.loanable_id, loan.loanable_type)}
                                                className={`group relative flex items-center justify-between p-4 rounded-xl border transition-all ${
                                                    isItemSelected(loan.loanable_id, loan.loanable_type) 
                                                        ? "bg-primary/5 border-primary/30" 
                                                        : "bg-slate-900/30 border-slate-800/50 hover:border-slate-700"
                                                } ${isSelectionMode ? "cursor-pointer" : ""}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    {isSelectionMode && (
                                                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                                                            isItemSelected(loan.loanable_id, loan.loanable_type)
                                                                ? "bg-primary border-primary"
                                                                : "border-slate-700"
                                                        }`}>
                                                            {isItemSelected(loan.loanable_id, loan.loanable_type) && <CheckCircle2 className="h-full w-full text-white" />}
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-200">
                                                            {loan.loanable_type === 'volume' ? `Tome ${(loan.loanable as Manga)?.number || "#" + loan.loanable_id}` : loan.loanable?.title}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <User className="h-3 w-3 text-slate-500" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                                {loan.borrower_name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="hidden sm:flex flex-col items-end">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-0.5">Prêté le</span>
                                                        <span className="text-[10px] font-bold text-slate-400">
                                                            {format(new Date(loan.loaned_at), "dd MMM yyyy", { locale: fr })}
                                                        </span>
                                                    </div>

                                                    {!isSelectionMode && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                returnLoan.mutate({ id: loan.loanable_id, type: loan.loanable_type });
                                                            }}
                                                            className="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                                                        >
                                                            Rendu
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="Aucun prêt actif"
                            description="Votre collection est au complet."
                            icon={<CheckCircle2 className="h-10 w-10 text-slate-800" />}
                        />
                    )}
                </TabsContent>

                <TabsContent value="past" className="outline-none">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 rounded-xl bg-slate-900/50 animate-pulse border border-slate-800/50" />
                            ))}
                        </div>
                    ) : groupedPastLoans.length > 0 ? (
                        <div className="space-y-10">
                            {groupedPastLoans.map((group) => (
                                <div key={`${group.series}-${group.item}`} className="space-y-3 opacity-70 grayscale-[0.5]">
                                    <div className="flex items-center gap-3">
                                        {group.type === "box" ? (
                                            <Package className="h-4 w-4 text-slate-500" />
                                        ) : (
                                            <BookOpen className="h-4 w-4 text-slate-500" />
                                        )}
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-sm font-black uppercase tracking-tight text-slate-300">{group.series}</span>
                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">— {group.item}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-2">
                                        {group.loans.map((loan) => (
                                            <div 
                                                key={loan.id}
                                                className="flex items-center justify-between p-4 rounded-xl border border-slate-800/30 bg-slate-900/10"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-400">
                                                        {loan.loanable_type === 'volume' ? `Tome ${(loan.loanable as Manga)?.number || "#" + loan.loanable_id}` : loan.loanable?.title}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <User className="h-3 w-3 text-slate-600" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                            {loan.borrower_name}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-8">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-700 mb-0.5">Rendu le</span>
                                                        <span className="text-[10px] font-bold text-slate-500">
                                                            {loan.returned_at ? format(new Date(loan.returned_at), "dd MMM yyyy", { locale: fr }) : "-"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="Historique vide"
                            description="Vous n'avez pas encore récupéré de mangas."
                            icon={<History className="h-10 w-10 text-slate-800" />}
                        />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
