import { useQuery, useMutation, useQueryClient, keepPreviousData, useInfiniteQuery, InfiniteData } from "@tanstack/react-query";
import { mangaService } from "@/services/manga.service";
import { loanService } from "@/services/loan.service";
import { wishlistService } from "@/services/wishlist.service";
import { readingProgressService } from "@/services/readingProgress.service";
import { userService } from "@/services/user.service";
import { planningService } from "@/services/planning.service";
import { Loan, Manga, Series, PlanningResponse } from "@/types/manga";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const queryKeys = {
    mangas: ["mangas"] as const,
    loans: ["loans"] as const,
    wishlist: ["wishlist"] as const,
    readingProgress: ["readingProgress"] as const,
    series: (id: number) => ["series", id] as const,
    edition: (id: number) => ["edition", id] as const,
    box: (id: number) => ["box", id] as const,
    boxSet: (id: number) => ["boxSet", id] as const,
    search: (query: string, page: number) => ["search", query, page] as const,
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

export function useBoxQuery(id: number) {
    return useQuery({
        queryKey: queryKeys.box(id),
        queryFn: () => mangaService.getBox(id),
        enabled: id > 0,
    });
}

/** Recherche catalogue — keepPreviousData pour paginer sans flash (client-swr-dedup) */
export function useSearchQuery(query: string, page: number) {
    return useQuery({
        queryKey: queryKeys.search(query, page),
        queryFn: () => mangaService.search(query, page),
        enabled: query.length > 0,
        staleTime: 5 * 60 * 1000,
        placeholderData: keepPreviousData, // smooth pagination — old data visible while fetching next page
    });
}

export function useBoxSetQuery(id: number) {
    return useQuery({
        queryKey: queryKeys.boxSet(id),
        queryFn: () => mangaService.getBoxSet(id),
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

export function useBulkCreateLoan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ volumeIds, borrowerName }: { volumeIds: number[]; borrowerName: string }) =>
            loanService.createBulk(volumeIds, borrowerName),
        onSuccess: (_, { volumeIds }) => {
            toast.success(`${volumeIds.length} volume${volumeIds.length > 1 ? 's' : ''} prêté${volumeIds.length > 1 ? 's' : ''}`);
            queryClient.invalidateQueries({ queryKey: queryKeys.loans });
            queryClient.invalidateQueries({ queryKey: queryKeys.mangas });
        },
        onError: () => {
            toast.error('Erreur lors du prêt');
        },
    });
}

export function useBulkCreateBoxLoan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ boxIds, borrowerName }: { boxIds: number[]; borrowerName: string }) =>
            Promise.all(boxIds.map(id => loanService.create(id, 'box', borrowerName))),
        onSuccess: (_, { boxIds }) => {
            toast.success(`${boxIds.length} boîte${boxIds.length > 1 ? 's' : ''} prêtée${boxIds.length > 1 ? 's' : ''}`);
            queryClient.invalidateQueries({ queryKey: queryKeys.loans });
        },
        onError: () => {
            toast.error('Erreur lors du prêt');
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

export function useAddBulkToCollection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ editionId, numbers }: { editionId: number; numbers: number[] }) =>
            mangaService.addBulk(editionId, numbers),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.mangas });
        },
    });
}

export function useBulkRemoveVolumesFromCollection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (volumeIds: number[]) =>
            mangaService.bulkRemoveVolumes(volumeIds),
        onSuccess: (_, ids) => {
            toast.success(`${ids.length} tome${ids.length > 1 ? 's' : ''} retiré${ids.length > 1 ? 's' : ''} de la collection`);
            queryClient.invalidateQueries({ queryKey: queryKeys.mangas });
        },
        onError: () => {
            toast.error("Erreur lors du retrait de la collection");
        },
    });
}

export function useAddBoxToCollection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (boxId: number) => mangaService.addBoxToCollection(boxId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.mangas });
        },
    });
}

export function useBulkRemoveBoxesFromCollection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (boxIds: number[]) =>
            Promise.all(boxIds.map(id => mangaService.removeBoxFromCollection(id))),
        onSuccess: (_, ids) => {
            toast.success(`${ids.length} boîte${ids.length > 1 ? 's' : ''} retirée${ids.length > 1 ? 's' : ''} de la collection`);
            queryClient.invalidateQueries({ queryKey: queryKeys.mangas });
        },
        onError: () => {
            toast.error("Erreur lors du retrait de la collection");
        },
    });
}

export function useAddToWishlist() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (editionId: number) => wishlistService.add(editionId, 'edition'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.wishlist });
        },
    });
}

/**
 * Hook unifié wishlist : ajoute ou retire une édition/coffret avec optimistic update.
 * Met à jour immédiatement `is_wishlisted` dans la cache série pour éviter le flash.
 */
export function useToggleWishlist() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, type, isCurrentlyWishlisted }: {
            id: number;
            type: 'edition' | 'box_set' | 'box';
            isCurrentlyWishlisted: boolean;
            seriesId?: number;
            boxSetId?: number;
        }) => {
            const apiType = type === 'edition' ? 'edition' : 'box';
            if (isCurrentlyWishlisted) {
                return wishlistService.remove(id, apiType);
            }
            return wishlistService.add(id, apiType);
        },
        onMutate: async ({ id, type, isCurrentlyWishlisted, seriesId, boxSetId }) => {
            const context: { previousSeries?: Series; seriesId?: number; previousBoxSet?: unknown; boxSetId?: number } = {};

            if (seriesId) {
                await queryClient.cancelQueries({ queryKey: queryKeys.series(seriesId) });
                const previousSeries = queryClient.getQueryData<Series>(queryKeys.series(seriesId));
                queryClient.setQueryData<Series>(queryKeys.series(seriesId), (old) => {
                    if (!old) return old;
                    if (type === 'edition') {
                        return {
                            ...old,
                            editions: old.editions?.map(e =>
                                e.id === id ? { ...e, is_wishlisted: !isCurrentlyWishlisted } : e
                            ),
                        };
                    }
                    return {
                        ...old,
                        box_sets: old.box_sets?.map(bs =>
                            bs.id === id ? { ...bs, is_wishlisted: !isCurrentlyWishlisted } : bs
                        ),
                    };
                });
                context.previousSeries = previousSeries;
                context.seriesId = seriesId;
            }

            if (boxSetId) {
                await queryClient.cancelQueries({ queryKey: queryKeys.boxSet(boxSetId) });
                const previousBoxSet = queryClient.getQueryData(queryKeys.boxSet(boxSetId));
                queryClient.setQueryData<{ boxes?: { id: number; is_wishlisted?: boolean }[] }>(
                    queryKeys.boxSet(boxSetId),
                    (old) => {
                        if (!old) return old;
                        return {
                            ...old,
                            boxes: old.boxes?.map(b =>
                                b.id === id ? { ...b, is_wishlisted: !isCurrentlyWishlisted } : b
                            ),
                        };
                    }
                );
                context.previousBoxSet = previousBoxSet;
                context.boxSetId = boxSetId;
            }

            return context;
        },
        onError: (_err, _vars, context) => {
            if (context?.previousSeries && context?.seriesId) {
                queryClient.setQueryData(queryKeys.series(context.seriesId), context.previousSeries);
            }
            if (context?.previousBoxSet && context?.boxSetId) {
                queryClient.setQueryData(queryKeys.boxSet(context.boxSetId), context.previousBoxSet);
            }
            toast.error("Erreur lors de la mise à jour de la wishlist");
        },
        onSuccess: (_data, { isCurrentlyWishlisted }) => {
            toast.success(isCurrentlyWishlisted ? "Retiré de la wishlist" : "Ajouté à la wishlist");
        },
        onSettled: (_data, _err, { seriesId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.wishlist });
            if (seriesId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.series(seriesId) });
            }
        },
    });
}

/** Wishlist rapide depuis la recherche catalogue — ajoute via api_id */
export function useAddToWishlistByApiId() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (apiId: string) => wishlistService.addByApiId(apiId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.wishlist });
            toast.success("Ajouté à la wishlist");
        },
        onError: () => {
            toast.error("Impossible d'ajouter à la wishlist");
        },
    });
}

// ─── Planning ────────────────────────────────────────────────────────────────

const planningQueryKey = ['planning'] as const;

export function usePlanningQuery() {
    return useInfiniteQuery({
        queryKey: planningQueryKey,
        queryFn: ({ pageParam }) => planningService.getPage(pageParam as string | undefined),
        getNextPageParam: (lastPage) =>
            lastPage.meta.has_more ? (lastPage.meta.next_cursor ?? undefined) : undefined,
        initialPageParam: undefined as string | undefined,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Toggle wishlist for a planning item with optimistic update on the planning cache.
 * volume → wishlist_type = 'edition' (via edition.id)
 * box    → wishlist_type = 'box'     (via item.id)
 */
export function useTogglePlanningWishlist() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ itemId, itemType, editionId, isCurrentlyWishlisted }: {
            itemId: number;
            itemType: 'volume' | 'box';
            editionId: number | null;
            isCurrentlyWishlisted: boolean;
        }) => {
            const wishlistType = itemType === 'volume' ? 'edition' : 'box';
            const wishlistId = itemType === 'volume' ? (editionId ?? itemId) : itemId;
            if (isCurrentlyWishlisted) {
                return wishlistService.remove(wishlistId, wishlistType);
            }
            return wishlistService.add(wishlistId, wishlistType);
        },
        onMutate: async ({ itemId, isCurrentlyWishlisted }) => {
            await queryClient.cancelQueries({ queryKey: planningQueryKey });
            const previous = queryClient.getQueryData<InfiniteData<PlanningResponse>>(planningQueryKey);
            queryClient.setQueryData<InfiniteData<PlanningResponse>>(planningQueryKey, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map(page => ({
                        ...page,
                        data: page.data.map(item =>
                            item.id === itemId
                                ? { ...item, is_wishlisted: !isCurrentlyWishlisted }
                                : item
                        ),
                    })),
                };
            });
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(planningQueryKey, context.previous);
            }
            toast.error("Erreur lors de la mise à jour de la wishlist");
        },
        onSuccess: (_data, { isCurrentlyWishlisted }) => {
            toast.success(isCurrentlyWishlisted ? "Retiré de la wishlist" : "Ajouté à la wishlist");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: planningQueryKey });
            queryClient.invalidateQueries({ queryKey: queryKeys.wishlist });
        },
    });
}

// ─── Settings ────────────────────────────────────────────────────────────────

export function useUpdateSettings() {
    const { updateUser } = useAuth();
    return useMutation({
        mutationFn: (payload: { username: string | null; is_public: boolean; theme: string; palette: string }) =>
            userService.updateSettings(payload),
        onSuccess: (updatedUser) => {
            updateUser(updatedUser);
            toast.success("Profil mis à jour");
        },
        onError: () => {
            toast.error("Échec de la mise à jour du profil");
        },
    });
}

export function useUpdateEmail() {
    const { updateUser } = useAuth();
    return useMutation({
        mutationFn: (payload: { email: string; current_password: string }) =>
            userService.updateEmail(payload),
        onSuccess: (updatedUser) => {
            updateUser(updatedUser);
            toast.success("Email modifié avec succès");
        },
        // Error is handled by the component to show specific field errors
    });
}

export function useUpdatePassword() {
    return useMutation({
        mutationFn: (payload: { current_password: string; password: string; password_confirmation: string }) =>
            userService.updatePassword(payload),
        onSuccess: () => {
            toast.success("Mot de passe modifié avec succès");
        },
    });
}


export function useImportMangaCollec() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (url: string) => userService.importMangaCollec(url),
        onSuccess: (result) => {
            toast.success(result.message);
            queryClient.invalidateQueries({ queryKey: queryKeys.mangas });
        },
    });
}

// ─── Public profiles ──────────────────────────────────────────────────────────

export function usePublicProfileQuery(username: string) {
    return useQuery({
        queryKey: queryKeys.publicProfile(username),
        queryFn: () => userService.getPublicProfile(username),
        enabled: !!username,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

export function usePublicCollectionQuery(username: string) {
    return useQuery({
        queryKey: queryKeys.publicCollection(username),
        queryFn: () => userService.getPublicCollection(username),
        enabled: !!username,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}
