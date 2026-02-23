"use client";

import { useState, useCallback, useRef } from "react";
import { BarcodeScanner } from "@/components/manga/barcode-scanner";
import { Button } from "@/components/ui/button";
import { ScanBarcode, Send, X, Loader2, CheckCircle2, Image as ImageIcon, WifiOff } from "lucide-react";
import Image from "next/image";
import api from "@/lib/api";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useOffline } from "@/contexts/OfflineContext";

interface ScannedItem {
    isbn: string;
    title?: string;
    cover_url?: string | null;
    isLoading: boolean;
    error?: boolean;
}

export default function ScanPage() {
    const { isOffline } = useOffline();
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Add cool down to prevent multiple scans of same barcode immediately
    const lastScanTimeRef = useRef<number>(0);

    const handleScan = useCallback(async (barcode: string) => {
        const now = Date.now();
        // Prevent registering the same barcode within 2 seconds
        if (now - lastScanTimeRef.current < 2000) return;

        lastScanTimeRef.current = now;

        // Vibrate if supported
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }

        let isDuplicate = false;

        setScannedItems((prev) => {
            if (prev.some(item => item.isbn === barcode)) {
                isDuplicate = true;
                return prev;
            }
            return [...prev, { isbn: barcode, isLoading: true }];
        });

        if (isDuplicate) {
            toast.error(`Code ${barcode} déjà scanné !`);
            return;
        }

        toast.success(`Code ${barcode} ajouté à la liste`);

        try {
            const response = await api.get(`/mangas/search?query=${encodeURIComponent(barcode)}`);
            const results = response.data.data;

            setScannedItems(prev => prev.map(item => {
                if (item.isbn === barcode) {
                    if (results.length > 0) {
                        return {
                            ...item,
                            isLoading: false,
                            title: results[0].title,
                            cover_url: results[0].cover_url
                        };
                    }
                    return { ...item, isLoading: false, error: true, title: "Manga introuvable" };
                }
                return item;
            }));
        } catch {
            setScannedItems(prev => prev.map(item =>
                item.isbn === barcode ? { ...item, isLoading: false, error: true, title: "Erreur réseau" } : item
            ));
        }
    }, []);

    const handleRemoveIsbn = (isbn: string) => {
        setScannedItems(prev => prev.filter(item => item.isbn !== isbn));
    };

    const handleSubmit = async () => {
        if (scannedItems.length === 0) return;
        setIsSubmitting(true);

        const isbnsToSubmit = scannedItems.map(item => item.isbn);

        try {
            await api.post("/mangas/scan-bulk", { isbns: isbnsToSubmit });
            toast.success(`${scannedItems.length} manga(s) ajouté(s) à votre collection !`);
            setScannedItems([]);
            setIsScanning(false);
        } catch (error) {
            console.error("Bulk scan error:", error);
            const errorMessage = error instanceof AxiosError ? error.response?.data?.message : "Échec de l'envoi.";
            toast.error(errorMessage || "Erreur lors de l'envoi groupé.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12 pointer-events-none">
                    <ScanBarcode className="h-40 w-40 text-purple-500" />
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="h-14 w-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <ScanBarcode className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Scanner à la chaîne</h1>
                        <p className="text-slate-400">Ajoutez rapidement vos tomes via leurs codes-barres.</p>
                    </div>
                </div>

                <div className="relative z-10 w-full md:w-auto">
                    {!isScanning ? (
                        <Button
                            className={`${isOffline ? 'bg-slate-800 text-slate-500' : 'bg-purple-600 hover:bg-purple-500 text-white'} w-full md:w-auto h-12 px-8 font-bold text-lg rounded-xl shadow-xl transition-all active:scale-95`}
                            onClick={() => setIsScanning(true)}
                            disabled={isOffline}
                        >
                            {isOffline ? <><WifiOff className="mr-2 h-5 w-5" /> Hors ligne</> : "Démarrer le scan"}
                        </Button>
                    ) : (
                        <Button
                            variant="destructive"
                            className="w-full md:w-auto h-12 px-8 font-bold rounded-xl transition-all active:scale-95 border-red-900/50 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white"
                            onClick={() => setIsScanning(false)}
                        >
                            Arrêter
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {isScanning && (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                        <BarcodeScanner onScan={handleScan} />
                        <p className="text-center text-slate-500 text-sm mt-4 italic font-medium">Placez le code-barres ISBN (EAN-13) au centre de l&apos;image.</p>
                    </div>
                )}

                {!isScanning && scannedItems.length === 0 && (
                    <div className="lg:col-span-2 p-12 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl transition-all">
                        <ScanBarcode className="h-16 w-16 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">Prêt à scanner</h3>
                        <p className="text-slate-500">
                            Prenez une pile de mangas et scannez leurs codes-barres les uns après les autres. Ils seront ajoutés d&apos;un seul coup.
                        </p>
                    </div>
                )}

                {scannedItems.length > 0 && (
                    <div className={`space-y-4 flex flex-col h-full bg-slate-900 p-6 border border-slate-800 rounded-3xl ${!isScanning ? 'lg:col-span-2 lg:max-w-xl lg:mx-auto w-full' : ''}`}>
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <h3 className="font-black text-xl flex items-center gap-2">
                                <CheckCircle2 className="text-green-500 h-6 w-6" />
                                {scannedItems.length} Manga{scannedItems.length > 1 ? 's' : ''} scanné{scannedItems.length > 1 ? 's' : ''}
                            </h3>
                        </div>

                        <div className="overflow-y-auto max-h-[350px] space-y-2 pr-2 custom-scrollbar flex-1">
                            {scannedItems.map((item) => (
                                <div key={item.isbn} className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800 rounded-xl group hover:border-slate-700 transition-colors">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="shrink-0 h-16 w-11 bg-slate-800 rounded-md overflow-hidden relative flex items-center justify-center border border-slate-700">
                                            {item.isLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                                            ) : item.cover_url ? (
                                                <Image src={item.cover_url} alt={item.title || item.isbn} fill className="object-cover" unoptimized />
                                            ) : (
                                                <ImageIcon className="h-4 w-4 text-slate-600" />
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            {item.isLoading ? (
                                                <>
                                                    <div className="h-4 w-32 bg-slate-800 rounded animate-pulse mb-1.5"></div>
                                                    <div className="h-3 w-24 bg-slate-800/50 rounded animate-pulse"></div>
                                                </>
                                            ) : (
                                                <>
                                                    <span className={`font-bold truncate text-sm leading-tight ${item.error ? 'text-red-400' : 'text-slate-200'}`}>
                                                        {item.title || "Titre inconnu"}
                                                    </span>
                                                    <span className="font-mono text-purple-400 text-[10px] bg-purple-500/10 px-1.5 py-0.5 rounded w-max mt-1">
                                                        {item.isbn}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10 shrink-0 opacity-50 group-hover:opacity-100 transition-all rounded-lg ml-2"
                                        onClick={() => handleRemoveIsbn(item.isbn)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 mt-auto">
                            <Button
                                className={`w-full h-14 ${isOffline ? 'bg-slate-800 text-slate-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'} font-black text-lg rounded-xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2`}
                                onClick={handleSubmit}
                                disabled={isSubmitting || isOffline}
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="h-5 w-5 animate-spin" /> Envoi en cours...</>
                                ) : isOffline ? (
                                    <><WifiOff className="h-5 w-5" /> Hors ligne</>
                                ) : (
                                    <><Send className="h-5 w-5" /> Ajouter à ma collection ({scannedItems.length})</>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
