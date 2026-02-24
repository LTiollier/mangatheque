import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mangaService } from "@/services/manga.service";
import { loanService } from "@/services/loan.service";
import { wishlistService } from "@/services/wishlist.service";
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

/** Marque un prêt comme rendu et invalide le cache automatiquement */
export function useReturnLoan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (volumeId: number) => loanService.markReturned(volumeId),
        onSuccess: () => {
            toast.success("Manga marqué comme rendu");
            queryClient.invalidateQueries({ queryKey: queryKeys.loans });
        },
        onError: () => {
            toast.error("Erreur lors de la validation du rendu");
        },
    });
}

/** Marque plusieurs prêts comme rendus et invalide le cache */
export function useBulkReturnLoans() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (volumeIds: number[]) => loanService.markManyReturned(volumeIds),
        onSuccess: () => {
            toast.success("Mangas marqués comme rendus");
            queryClient.invalidateQueries({ queryKey: queryKeys.loans });
        },
        onError: () => {
            toast.error("Erreur lors de la validation du rendu");
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
