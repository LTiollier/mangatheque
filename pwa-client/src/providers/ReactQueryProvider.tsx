"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
    // Un QueryClient par instance navigateur (stable entre renders, partagé entre pages)
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 60 * 1000,   // 5 min — données fraîches sans re-fetch
                        gcTime: 10 * 60 * 1000,      // 10 min — cache conservé en mémoire
                        retry: 1,                     // 1 retry max sur les erreurs réseau
                        refetchOnWindowFocus: false,  // PWA : pas de re-fetch au focus
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
