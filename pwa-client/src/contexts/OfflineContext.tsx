"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

interface OfflineContextType {
    isOffline: boolean;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
    const isOnline = useOnlineStatus();
    const isOffline = !isOnline;
    const isFirstRender = React.useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (isOnline) {
            toast.success("Vous êtes de nouveau en ligne", {
                description: "Les fonctionnalités de modification sont activées.",
            });
        } else {
            toast.error("Vous êtes hors ligne", {
                description: "Les modifications sont désactivées jusqu'au retour de la connexion.",
                icon: <WifiOff className="h-4 w-4" />,
                duration: Infinity,
            });
        }
    }, [isOnline]);

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
