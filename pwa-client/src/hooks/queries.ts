import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mangaService } from "@/services/manga.service";
import { loanService } from "@/services/loan.service";
import { wishlistService } from "@/services/wishlist.service";
import { readingProgressService } from "@/services/readingProgress.service";
import { Loan } from "@/types/manga";
import { toast } from "sonner";

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const queryKeys = {
    mangas: ["mangas"] as const,
    loans: ["loans"] as const,
    wishlist: ["wishlist"] as const,
    readingProgress: ["readingProgress"] as const,
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
        mutationFn: ({ id, type }: { id: number, type: 'volume' | 'box' }) => loanService.markReturned(id, type),
        onMutate: async ({ id, type }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.loans });
            // Snapshot the previous value
            const previousLoans = queryClient.getQueryData<Loan[]>(queryKeys.loans);
            // Optimistically update to the new value
            if (previousLoans) {
                queryClient.setQueryData<Loan[]>(queryKeys.loans,
                    previousLoans.map(loan =>
                        loan.loanable_id === id && loan.loanable_type === type
                            ? { ...loan, is_returned: true, returned_at: new Date().toISOString() }
                            : loan
                    )
                );
            }
            return { previousLoans };
        },
        onError: (err, variables, context) => {
            // Rollback on error
            if (context?.previousLoans) {
                queryClient.setQueryData(queryKeys.loans, context.previousLoans);
            }
            toast.error("Erreur lors de la validation du rendu");
        },
        onSuccess: () => {
            toast.success("Marqué comme rendu");
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
        mutationFn: (items: { id: number, type: 'volume' | 'box' }[]) => loanService.markManyReturned(items),
        onMutate: async (items) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.loans });
            const previousLoans = queryClient.getQueryData<Loan[]>(queryKeys.loans);
            if (previousLoans) {
                queryClient.setQueryData<Loan[]>(queryKeys.loans,
                    previousLoans.map(loan => {
                        const isSelected = items.some(item => item.id === loan.loanable_id && item.type === loan.loanable_type);
                        return isSelected
                            ? { ...loan, is_returned: true, returned_at: new Date().toISOString() }
                            : loan;
                    })
                );
            }
            return { previousLoans };
        },
        onError: (err, variables, context) => {
            if (context?.previousLoans) {
                queryClient.setQueryData(queryKeys.loans, context.previousLoans);
            }
            toast.error("Erreur lors de la validation du rendu");
        },
        onSuccess: () => {
            toast.success("Marqués comme rendus");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.loans });
        },
    });
}

// ─── Reading Progress ─────────────────────────────────────────────────────────

/** Récupère tout le suivi de lecture de l'utilisateur */
export function useReadingProgressQuery() {
    return useQuery({
        queryKey: queryKeys.readingProgress,
        queryFn: readingProgressService.getAll,
    });
}

/** Toggle le statut lu/non lu pour plusieurs volumes */
export function useBulkToggleReadingProgress() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (volumeIds: number[]) => readingProgressService.toggleBulk(volumeIds),
        onSuccess: (result) => {
            if (result.removed.length > 0 && result.toggled.length === 0) {
                toast.success(`${result.removed.length} tome(s) marqué(s) comme non lu(s)`);
            } else if (result.toggled.length > 0 && result.removed.length === 0) {
                toast.success(`${result.toggled.length} tome(s) marqué(s) comme lu(s)`);
            } else {
                toast.success("Progression mise à jour");
            }
            queryClient.invalidateQueries({ queryKey: queryKeys.readingProgress });
        },
        onError: () => {
            toast.error("Erreur lors de la mise à jour de la progression");
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
        mutationFn: ({ id, type }: { id: number; type: 'edition' | 'box' }) =>
            wishlistService.remove(id, type),
        onSuccess: () => {
            toast.success("Retiré de la liste de souhaits");
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

/** Ajoute une édition à la wishlist et invalide le cache */
export function useAddEditionToWishlist() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (editionId: number) => wishlistService.addByEditionId(editionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.wishlist });
        },
    });
}

/** Ajoute un coffret (box) à la wishlist et invalide le cache */
export function useAddBoxToWishlist() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (boxId: number) => wishlistService.addBox(boxId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.wishlist });
        },
    });
}
