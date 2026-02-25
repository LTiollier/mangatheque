import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mangaService } from "@/services/manga.service";
import { loanService } from "@/services/loan.service";
import { wishlistService } from "@/services/wishlist.service";
import { Loan } from "@/types/manga";
import { toast } from "sonner";

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const queryKeys = {
    mangas: ["mangas"] as const,
    loans: ["loans"] as const,
    wishlist: ["wishlist"] as const,
    publicCollection: (username: string) => ["publicCollection", username] as const,
    publicProfile: (username: string) => ["publicProfile", username] as const,
};

// ─── Collection ────────────────────────────────────────────────────────────────

/** Récupère toute la collection de l'utilisateur, avec cache partagé entre pages */
export function useMangas() {
    return useQuery({
        queryKey: queryKeys.mangas,
        queryFn: mangaService.getCollection,
    });
}

// ─── Loans ────────────────────────────────────────────────────────────────────

/** Récupère tous les prêts, avec cache partagé */
export function useLoansQuery() {
    return useQuery({
        queryKey: queryKeys.loans,
        queryFn: loanService.getAll,
    });
}

/** Marque un prêt comme rendu avec mise à jour optimiste */
export function useReturnLoan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (volumeId: number) => loanService.markReturned(volumeId),
        onMutate: async (volumeId) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.loans });
            // Snapshot the previous value
            const previousLoans = queryClient.getQueryData<Loan[]>(queryKeys.loans);
            // Optimistically update to the new value
            if (previousLoans) {
                queryClient.setQueryData<Loan[]>(queryKeys.loans,
                    previousLoans.map(loan =>
                        loan.volume_id === volumeId
                            ? { ...loan, is_returned: true, returned_at: new Date().toISOString() }
                            : loan
                    )
                );
            }
            return { previousLoans };
        },
        onError: (err, volumeId, context) => {
            // Rollback on error
            if (context?.previousLoans) {
                queryClient.setQueryData(queryKeys.loans, context.previousLoans);
            }
            toast.error("Erreur lors de la validation du rendu");
        },
        onSuccess: () => {
            toast.success("Manga marqué comme rendu");
        },
        onSettled: () => {
            // Always refetch after error or success to sync with server
            queryClient.invalidateQueries({ queryKey: queryKeys.loans });
        },
    });
}

/** Marque plusieurs prêts comme rendus avec mise à jour optimiste */
export function useBulkReturnLoans() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (volumeIds: number[]) => loanService.markManyReturned(volumeIds),
        onMutate: async (volumeIds) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.loans });
            const previousLoans = queryClient.getQueryData<Loan[]>(queryKeys.loans);
            if (previousLoans) {
                queryClient.setQueryData<Loan[]>(queryKeys.loans,
                    previousLoans.map(loan =>
                        volumeIds.includes(loan.volume_id)
                            ? { ...loan, is_returned: true, returned_at: new Date().toISOString() }
                            : loan
                    )
                );
            }
            return { previousLoans };
        },
        onError: (err, volumeIds, context) => {
            if (context?.previousLoans) {
                queryClient.setQueryData(queryKeys.loans, context.previousLoans);
            }
            toast.error("Erreur lors de la validation du rendu");
        },
        onSuccess: () => {
            toast.success("Mangas marqués comme rendus");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.loans });
        },
    });
}

// ─── Wishlist ────────────────────────────────────────────────────────────────

/** Récupère la wishlist, avec cache partagé */
export function useWishlist() {
    return useQuery({
        queryKey: queryKeys.wishlist,
        queryFn: wishlistService.getAll,
    });
}

/** Retire un item de la wishlist et invalide le cache */
export function useRemoveFromWishlist() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (mangaId: string) => wishlistService.remove(mangaId),
        onSuccess: () => {
            toast.success("Manga retiré de la liste de souhaits");
            queryClient.invalidateQueries({ queryKey: queryKeys.wishlist });
        },
        onError: () => {
            toast.error("Échec du retrait.");
        },
    });
}

/** Ajoute un manga à la collection et invalide le cache */
export function useAddToCollection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (apiId: string) => mangaService.addToCollection(apiId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.mangas });
        },
    });
}

/** Ajoute un manga à la wishlist et invalide le cache */
export function useAddToWishlist() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (apiId: string) => wishlistService.add(apiId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.wishlist });
        },
    });
}
