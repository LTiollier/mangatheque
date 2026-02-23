"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { WifiOff } from "lucide-react";

interface OfflineContextType {
    isOffline: boolean;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
    const [isOffline, setIsOffline] = useState<boolean>(
        typeof navigator !== "undefined" ? !navigator.onLine : false
    );

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            toast.success("Vous êtes de nouveau en ligne", {
                description: "Les fonctionnalités de modification sont activées.",
            });
        };

        const handleOffline = () => {
            setIsOffline(true);
            toast.error("Vous êtes hors ligne", {
                description: "Les modifications sont désactivées jusqu'au retour de la connexion.",
                icon: <WifiOff className="h-4 w-4" />,
                duration: Infinity,
            });
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <OfflineContext.Provider value={{ isOffline }}>
            {children}
        </OfflineContext.Provider>
    );
}

export function useOffline() {
    const context = useContext(OfflineContext);
    if (context === undefined) {
        throw new Error("useOffline must be used within an OfflineProvider");
    }
    return context;
}
