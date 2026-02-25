"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { AlertCircle, Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
    onScan: (barcode: string) => void;
    onClose?: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const readerElementId = "reader";

        const initScanner = async () => {
            try {
                // Determine if cameras are available
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

                    // Only start if not already scanning
                    if (!html5QrCode.isScanning) {
                        await html5QrCode.start(
                            { facingMode: "environment" },
                            {
                                fps: 10,
                                qrbox: { width: 250, height: 150 }
                            },
                            (decodedText) => {
                                // Only trigger EAN/ISBN codes (mostly length 13)
                                if (decodedText.length === 13) {
                                    // optional: Stop scanning or let it continuously scan
                                    // html5QrCode.pause(); // if we want to pause after scan
                                    onScan(decodedText);
                                }
                            },
                            () => {
                                // Ignored (fires on every frame that doesn't find a code)
                            }
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

        // Adding a slight delay to ensure UI is ready
        const timeoutId = setTimeout(() => {
            if (document.getElementById(readerElementId)) {
                initScanner();
            }
        }, 100);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);

            // Clean up the scanner properly
            if (scannerRef.current) {
                const scanner = scannerRef.current;
                if (scanner.isScanning) {
                    scanner.stop().then(() => {
                        scanner.clear();
                    }).catch(console.error);
                } else {
                    try {
                        scanner.clear();
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        };
    }, [onScan]);

    return (
        <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-2xl bg-black border border-slate-800 shadow-2xl">
            {onClose && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute top-2 right-2 z-50 bg-black/50 text-white hover:bg-black/80 rounded-full h-8 w-8"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}

            {error ? (
                <div className="flex flex-col items-center justify-center p-8 h-[300px] text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                    <p className="text-white font-medium">{error}</p>
                </div>
            ) : (
                <div className="relative h-[300px] sm:h-[400px]">
                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
                            <Camera className="h-12 w-12 text-slate-700 animate-pulse mb-4" />
                            <div className="flex items-center gap-2 text-slate-400">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Initialisation...</span>
                            </div>
                        </div>
                    )}
                    <div id="reader" className="w-full h-full [&>video]:object-cover" />

                    {/* Overlay Grid / Scan Area highlight */}
                    <div className="absolute inset-0 z-20 pointer-events-none border-[40px] border-black/50 flex items-center justify-center">
                        <div className="w-[250px] h-[150px] border-2 border-purple-500 rounded-xl relative">
                            {/* Scanning line animation */}
                            <div className="absolute left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-scan" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
