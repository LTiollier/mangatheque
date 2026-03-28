"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
    // Un QueryClient par instance navigateur — stable entre renders, partagé entre pages
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 60 * 1000,   // 5 min — données fraîches sans re-fetch
                        gcTime: 10 * 60 * 1000,      // 10 min — cache conservé en mémoire
                        // Ne pas retry les erreurs client 4xx (profil inexistant, auth…)
                        // Retry jusqu'à 3 fois pour les erreurs réseau et 5xx
                        retry: (failureCount, error) => {
                            const status = (error as { response?: { status?: number } })?.response?.status;
                            if (status !== undefined && status < 500) return false;
                            return failureCount < 3;
                        },
                        // Backoff exponentiel : 1s → 2s → 4s, plafonné à 30s
                        retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 30_000),
                        refetchOnWindowFocus: false,  // PWA : pas de re-fetch au focus
                    },
                    mutations: {
                        // Ne jamais retry une mutation automatiquement :
                        // un double POST/PUT/DELETE peut créer des doublons
                        retry: 0,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
