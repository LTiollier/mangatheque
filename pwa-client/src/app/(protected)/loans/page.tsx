"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeftRight,
    Calendar,
    User,
    CheckCircle2,
    Clock,
    History,
    Search
} from "lucide-react";
import api from "@/lib/api";
import { Loan } from "@/types/manga";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function LoansPage() {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchLoans = async () => {
        try {
            setIsLoading(true);
            const response = await api.get("/loans");
            setLoans(response.data.data);
        } catch (error) {
            toast.error("Erreur lors de la récupération des prêts");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLoans();
    }, []);

    const handleReturn = async (volumeId: number) => {
        try {
            await api.post("/loans/return", { volume_id: volumeId });
            toast.success("Manga marqué comme rendu");
            fetchLoans();
        } catch (error) {
            toast.error("Erreur lors de la validation du rendu");
            console.error(error);
        }
    };

    const filteredLoans = loans.filter(loan =>
        loan.borrower_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.volume?.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeLoans = filteredLoans.filter(loan => !loan.is_returned);
    const pastLoans = filteredLoans.filter(loan => loan.is_returned);

    return (
        <Shell>
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
                    <TabsList className="bg-slate-900 border-slate-800 p-1 rounded-xl h-12 w-full md:w-auto">
                        <TabsTrigger value="active" className="rounded-lg font-bold data-[state=active]:bg-purple-600 data-[state=active]:text-white h-10 px-6">
                            <Clock className="h-4 w-4 mr-2" />
                            En cours ({activeLoans.length})
                        </TabsTrigger>
                        <TabsTrigger value="past" className="rounded-lg font-bold data-[state=active]:bg-purple-600 data-[state=active]:text-white h-10 px-6">
                            <History className="h-4 w-4 mr-2" />
                            Historique ({pastLoans.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="pt-6">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-48 rounded-2xl bg-slate-900 animate-pulse border border-slate-800" />
                                ))}
                            </div>
                        ) : activeLoans.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {activeLoans.map((loan) => (
                                    <LoanCard key={loan.id} loan={loan} onReturn={() => handleReturn(loan.volume_id)} />
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
                        ) : pastLoans.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pastLoans.map((loan) => (
                                    <LoanCard key={loan.id} loan={loan} />
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
        </Shell>
    );
}

function LoanCard({ loan, onReturn }: { loan: Loan; onReturn?: () => void }) {
    return (
        <Card className="bg-slate-900/50 border-slate-800 overflow-hidden hover:border-purple-500/30 transition-all group">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start gap-2">
                    <Badge variant={loan.is_returned ? "secondary" : "outline"} className={loan.is_returned ? "bg-slate-800 text-slate-400" : "bg-purple-500/10 text-purple-400 border-purple-500/20"}>
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

                {!loan.is_returned && onReturn && (
                    <Button
                        onClick={onReturn}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl h-10 group/btn"
                    >
                        <CheckCircle2 className="mr-2 h-4 w-4 text-slate-400 group-hover/btn:text-green-500" />
                        Marquer comme rendu
                    </Button>
                )}

                {loan.is_returned && loan.returned_at && (
                    <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1 font-medium bg-slate-950/30 py-2 rounded-lg">
                        Rendu le {format(new Date(loan.returned_at), "dd MMMM yyyy", { locale: fr })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function EmptyState({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl text-center space-y-4">
            <div className="p-4 bg-slate-900 rounded-2xl">
                {icon}
            </div>
            <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-200">{title}</h3>
                <p className="text-slate-500 max-w-xs mx-auto text-sm">{description}</p>
            </div>
        </div>
    );
}
