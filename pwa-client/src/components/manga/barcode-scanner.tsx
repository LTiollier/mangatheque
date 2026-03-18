"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { AlertCircle, Camera, Loader2, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface BarcodeScannerProps {
    onScan: (barcode: string) => void;
    onClose?: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
    const onScanRef = useRef(onScan);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastScan, setLastScan] = useState<string | null>(null);
    const [isFlashing, setIsFlashing] = useState(false);

    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    useEffect(() => {
        let isMounted = true;
        const readerElementId = "reader";

        const initScanner = async () => {
            try {
                const cameras = await Html5Qrcode.getCameras();
                if (cameras && cameras.length > 0) {
                    if (!isMounted) return;

                    const html5QrCode = new Html5Qrcode(readerElementId, {
                        verbose: false,
                        formatsToSupport: [
                            Html5QrcodeSupportedFormats.EAN_13,
                            Html5QrcodeSupportedFormats.EAN_8,
                        ]
                    });

                    scannerRef.current = html5QrCode;

                    if (!html5QrCode.isScanning) {
                        await html5QrCode.start(
                            { facingMode: "environment" },
                            {
                                fps: 15,
                                qrbox: { width: 250, height: 150 }
                            },
                            (decodedText) => {
                                if (decodedText.length === 13 && decodedText !== lastScan) {
                                    setLastScan(decodedText);
                                    setIsFlashing(true);
                                    setTimeout(() => setIsFlashing(false), 300);
                                    onScanRef.current(decodedText);
                                    
                                    // Vibrate if supported
                                    if (navigator.vibrate) {
                                        navigator.vibrate(50);
                                    }
                                }
                            },
                            () => {}
                        );
                        setIsLoading(false);
                    }
                } else {
                    if (isMounted) setError("Aucune caméra trouvée sur l'appareil.");
                }
            } catch (err) {
                console.error("Camera init error:", err);
                if (isMounted) setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
            }
        };

        const timeoutId = setTimeout(() => {
            if (document.getElementById(readerElementId)) {
                initScanner();
            }
        }, 100);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
            if (scannerRef.current) {
                const scanner = scannerRef.current;
                if (scanner.isScanning) {
                    scanner.stop().then(() => scanner.clear()).catch(console.error);
                } else {
                    try { scanner.clear(); } catch (e) { console.error(e); }
                }
            }
        };
    }, [lastScan]);

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-sm mx-auto overflow-hidden rounded-3xl bg-black border-2 border-border shadow-2xl"
        >
            {onClose && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute top-3 right-3 z-50 bg-black/50 backdrop-blur-md text-white hover:bg-black/80 rounded-full h-10 w-10 border border-white/10"
                >
                    <X className="h-5 w-5" />
                </Button>
            )}

            {error ? (
                <div className="flex flex-col items-center justify-center p-8 h-[300px] text-center">
                    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                    <p className="text-white font-bold uppercase tracking-tight">{error}</p>
                </div>
            ) : (
                <div className="relative h-[300px] sm:h-[400px]">
                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10">
                            <div className="relative">
                                <Camera className="h-16 w-16 text-muted-foreground animate-pulse mb-6" />
                                <motion.div 
                                    className="absolute inset-0 border-2 border-primary rounded-xl"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0, 0.5, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground font-black uppercase tracking-widest text-xs">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                <span>Initialisation caméra...</span>
                            </div>
                        </div>
                    )}
                    
                    <div id="reader" className="w-full h-full [&>video]:object-cover" />

                    {/* Scan Area Overlay */}
                    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center">
                        <div className="w-full h-full border-[60px] border-black/60 absolute inset-0" />
                        
                        <div className="relative w-[260px] h-[160px]">
                            {/* Corners */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl" />
                            
                            {/* Scanning line */}
                            <motion.div 
                                className="absolute left-4 right-4 h-1 bg-primary/80 shadow-[0_0_15px_rgba(255,87,34,0.6)] rounded-full"
                                animate={{ top: ["10%", "90%", "10%"] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </div>
                        
                        <p className="absolute bottom-16 text-[10px] font-black text-white/60 uppercase tracking-[0.3em] bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/5">
                            Ciblez le code-barres au dos
                        </p>
                    </div>

                    {/* Flash Effect */}
                    <AnimatePresence>
                        {isFlashing && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-white z-30"
                            />
                        )}
                    </AnimatePresence>

                    {/* Feedback on Scan */}
                    <AnimatePresence>
                        {lastScan && isFlashing && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.5 }}
                                className="absolute inset-0 flex items-center justify-center z-40"
                            >
                                <div className="bg-primary p-4 rounded-full shadow-2xl">
                                    <CheckCircle2 className="h-12 w-12 text-white" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    );
}
