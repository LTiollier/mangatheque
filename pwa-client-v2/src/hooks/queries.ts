import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mangaService } from "@/services/manga.service";
import { loanService } from "@/services/loan.service";
import { wishlistService } from "@/services/wishlist.service";
import { readingProgressService } from "@/services/readingProgress.service";
import { Loan, Manga } from "@/types/manga";
import { toast } from "sonner";

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const queryKeys = {
    mangas: ["mangas"] as const,
    loans: ["loans"] as const,
    wishlist: ["wishlist"] as const,
    readingProgress: ["readingProgress"] as const,
    series: (id: number) => ["series", id] as const,
    edition: (id: number) => ["edition", id] as const,
    publicCollection: (username: string) => ["publicCollection", username] as const,
    publicProfile: (username: string) => ["publicProfile", username] as const,
};

// ─── Collection ────────────────────────────────────────────────────────────────

/**
 * Récupère toute la collection de l'utilisateur.
 *
 * `initialData` optionnel permet d'hydrater depuis un Server Component :
 * ```tsx
 * // Dans un Server Component :
 * const mangas = await mangaService.getCollection();
 * // Dans le Client Island :
 * const { data } = useMangas(mangas);
 * ```
 * Règle Vercel `async-waterfalls` : les Server Components fetchent en parallèle
 * et passent initialData aux hooks client — zéro waterfall côté client.
 */
export function useMangas(initialData?: Manga[]) {
    return useQuery({
        queryKey: queryKeys.mangas,
        queryFn: mangaService.getCollection,
        initialData,
    });
}

export function useSeriesQuery(id: number) {
    return useQuery({
        queryKey: queryKeys.series(id),
        queryFn: () => mangaService.getSeries(id),
        enabled: id > 0,
    });
}

export function useEditionQuery(id: number) {
    return useQuery({
        queryKey: queryKeys.edition(id),
        queryFn: () => mangaService.getEdition(id),
        enabled: id > 0,
    });
}

// ─── Loans ────────────────────────────────────────────────────────────────────

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
        mutationFn: ({ id, type }: { id: number, type: 'volume' | 'box' }) =>
            loanService.markReturned(id, type),
        onMutate: async ({ id, type }) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.loans });
            const previousLoans = queryClient.getQueryData<Loan[]>(queryKeys.loans);
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
        onError: (_err, _variables, context) => {
            if (context?.previousLoans) {
                queryClient.setQueryData(queryKeys.loans, context.previousLoans);
            }
            toast.error("Erreur lors de la validation du rendu");
        },
        onSuccess: () => {
            toast.success("Marqué comme rendu");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.loans });
        },
    });
}

/** Marque plusieurs prêts comme rendus avec mise à jour optimiste */
export function useBulkReturnLoans() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (items: { id: number, type: 'volume' | 'box' }[]) =>
            loanService.markManyReturned(items),
        onMutate: async (items) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.loans });
            const previousLoans = queryClient.getQueryData<Loan[]>(queryKeys.loans);
            if (previousLoans) {
                queryClient.setQueryData<Loan[]>(queryKeys.loans,
                    previousLoans.map(loan => {
                        const isSelected = items.some(
                            item => item.id === loan.loanable_id && item.type === loan.loanable_type
                        );
                        return isSelected
                            ? { ...loan, is_returned: true, returned_at: new Date().toISOString() }
                            : loan;
                    })
                );
            }
            return { previousLoans };
        },
        onError: (_err, _variables, context) => {
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

export function useCreateLoan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, type, borrowerName, notes }: {
            id: number;
            type: 'volume' | 'box';
            borrowerName: string;
            notes?: string;
        }) => loanService.create(id, type, borrowerName, notes),
        onSuccess: () => {
            toast.success('Prêt enregistré');
            queryClient.invalidateQueries({ queryKey: queryKeys.loans });
            queryClient.invalidateQueries({ queryKey: queryKeys.mangas });
        },
        onError: () => {
            toast.error('Erreur lors de la création du prêt');
        },
    });
}

// ─── Reading Progress ─────────────────────────────────────────────────────────

export function useReadingProgressQuery() {
    return useQuery({
        queryKey: queryKeys.readingProgress,
        queryFn: readingProgressService.getAll,
    });
}

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

export function useWishlist() {
    return useQuery({
        queryKey: queryKeys.wishlist,
        queryFn: wishlistService.getAll,
    });
}

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

export function useAddToCollection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (apiId: string) => mangaService.addToCollection(apiId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.mangas });
        },
    });
}

export function useAddToWishlist() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (editionId: number) => wishlistService.addByEditionId(editionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.wishlist });
        },
    });
}
