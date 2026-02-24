"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    ArrowLeftRight,
    Search,
    BookOpen,
    Loader2,
    CheckCircle2,
    Clock,
    History,
} from "lucide-react";
import { Loan } from "@/types/manga";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoanCard } from "@/components/manga/LoanCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLoans } from "@/hooks/useLoans";

export default function LoansPage() {
    const { loans, isLoading, fetchLoans, handleReturn, handleBulkReturn } = useLoans();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLoans, setSelectedLoans] = useState<number[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isReturning, setIsReturning] = useState(false);

    useEffect(() => {
        fetchLoans();
    }, [fetchLoans]);

    const handleBulkReturnWithLoading = async () => {
        if (selectedLoans.length === 0) return;
        setIsReturning(true);
        try {
            await handleBulkReturn(selectedLoans);
            setSelectedLoans([]);
            setIsSelectionMode(false);
        } finally {
            setIsReturning(false);
        }
    };

    const toggleSelection = (volumeId: number) => {
        setSelectedLoans(prev =>
            prev.includes(volumeId) ? prev.filter(id => id !== volumeId) : [...prev, volumeId]
        );
    };

    const filteredLoans = loans.filter(loan =>
        loan.borrower_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (loan.volume?.title.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    );

    const activeLoans = filteredLoans.filter(loan => !loan.is_returned);
    const pastLoans = filteredLoans.filter(loan => loan.is_returned);

    const groupByEdition = (loansArray: Loan[]) => {
        return loansArray.reduce((acc, loan) => {
            const seriesName = loan.volume?.series?.title || "Série Inconnue";
            const editionName = loan.volume?.edition?.name || "Édition Inconnue";
            const groupKey = `${seriesName} - ${editionName}`;

            if (!acc[groupKey]) {
                acc[groupKey] = [];
            }
            acc[groupKey].push(loan);
            return acc;
        }, {} as Record<string, Loan[]>);
    };

    const groupedActiveLoans = Object.entries(groupByEdition(activeLoans));
    const groupedPastLoans = Object.entries(groupByEdition(pastLoans));

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider">
                        <ArrowLeftRight className="h-3 w-3" />
                        Gestion des Prêts
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Mes Prêts
                    </h1>
                    <p className="text-slate-400 font-medium">
                        Suivez qui possède vos volumes de mangas.
                    </p>
                </div>

                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                    <Input
                        placeholder="Chercher un emprunteur ou un titre..."
                        className="pl-10 h-12 bg-slate-900/50 border-slate-800 rounded-xl focus:ring-purple-500/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <Tabs defaultValue="active" className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                    <TabsList className="bg-slate-900 border-slate-800 p-1 rounded-xl h-12 w-full sm:w-auto">
                        <TabsTrigger value="active" className="rounded-lg font-bold data-[state=active]:bg-purple-600 data-[state=active]:text-white h-10 px-6">
                            <Clock className="h-4 w-4 mr-2" />
                            En cours ({activeLoans.length})
                        </TabsTrigger>
                        <TabsTrigger value="past" className="rounded-lg font-bold data-[state=active]:bg-purple-600 data-[state=active]:text-white h-10 px-6">
                            <History className="h-4 w-4 mr-2" />
                            Historique ({pastLoans.length})
                        </TabsTrigger>
                    </TabsList>

                    {activeLoans.length > 0 && (
                        <div className="flex gap-2">
                            <Button
                                variant={isSelectionMode ? "ghost" : "outline"}
                                className="border-slate-800"
                                onClick={() => {
                                    setIsSelectionMode(!isSelectionMode);
                                    setSelectedLoans([]);
                                }}
                            >
                                {isSelectionMode ? "Annuler" : "Multi-sélection"}
                            </Button>
                            {isSelectionMode && selectedLoans.length > 0 && (
                                <Button
                                    className="bg-green-600 hover:bg-green-500 font-bold"
                                    onClick={handleBulkReturnWithLoading}
                                    disabled={isReturning}
                                >
                                    {isReturning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                    Rendu ({selectedLoans.length})
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <TabsContent value="active" className="pt-6">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-48 rounded-2xl bg-slate-900 animate-pulse border border-slate-800" />
                            ))}
                        </div>
                    ) : groupedActiveLoans.length > 0 ? (
                        <div className="space-y-8">
                            {groupedActiveLoans.map(([editionName, editionLoans]) => (
                                <div key={editionName} className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2 border-b border-slate-800 pb-2">
                                        <BookOpen className="h-5 w-5 text-purple-500" />
                                        {editionName}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {editionLoans.map((loan) => (
                                            <LoanCard
                                                key={loan.id}
                                                loan={loan}
                                                onReturn={() => handleReturn(loan.volume_id)}
                                                isSelectionMode={isSelectionMode}
                                                isSelected={selectedLoans.includes(loan.volume_id)}
                                                onToggleSelect={() => toggleSelection(loan.volume_id)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="Aucun prêt en cours"
                            description="Tous vos mangas sont bien rangés dans votre bibliothèque !"
                            icon={<CheckCircle2 className="h-12 w-12 text-slate-700" />}
                        />
                    )}
                </TabsContent>

                <TabsContent value="past" className="pt-6">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-48 rounded-2xl bg-slate-900 animate-pulse border border-slate-800" />
                            ))}
                        </div>
                    ) : groupedPastLoans.length > 0 ? (
                        <div className="space-y-8">
                            {groupedPastLoans.map(([editionName, editionLoans]) => (
                                <div key={editionName} className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2 border-b border-slate-800 pb-2">
                                        <BookOpen className="h-5 w-5 text-purple-500" />
                                        {editionName}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {editionLoans.map((loan) => (
                                            <LoanCard key={loan.id} loan={loan} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="Historique vide"
                            description="Vous n'avez pas encore récupéré de mangas prêtés."
                            icon={<History className="h-12 w-12 text-slate-700" />}
                        />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
