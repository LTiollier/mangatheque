import { cache } from 'react';
import api, { ApiResponse } from '@/lib/api';
import { isHttpError } from '@/lib/error';
import {
    Volume, VolumeSearchResult, Series, Edition, Box, BoxSet,
    PaginatedSeriesSearchResult,
} from '@/types/volume';

/**
 * Améliorations audit Phase 1 :
 *
 * 1. `getCollection` wrappé avec `React.cache()` pour la déduplication dans les
 *    Server Components (règle Vercel `server-cache-react`) :
 *    Sans cache() → 2 Server Components = 2 requêtes HTTP
 *    Avec cache()  → même render = 1 seule requête
 *
 * 2. Validation Zod déplacée côté serveur (audit Phase 2, règle `server-serialization`).
 *    Les services client se fient aux types TypeScript — la validation runtime
 *    se fait dans les Server Actions et les Route Handlers.
 */

/** Pour les Server Components : déduplication via React.cache() */
export const getCollection = cache(() =>
    api.get<ApiResponse<Volume[]>>('/volumes')
        .then(r => r.data.data as Volume[])
);

export const volumeService = {
    /** Client-side : via React Query (utilise le même endpoint) */
    getCollection: () =>
        api.get<ApiResponse<Volume[]>>('/volumes')
            .then(r => r.data.data as Volume[]),

    search: (query: string, page = 1) =>
        api.get<PaginatedSeriesSearchResult>(
            `/volumes/search?query=${encodeURIComponent(query)}&page=${page}`
        ).then(r => r.data as PaginatedSeriesSearchResult),

    searchByIsbn: async (isbn: string): Promise<VolumeSearchResult | null> => {
        try {
            const r = await api.get<ApiResponse<VolumeSearchResult>>(
                `/volumes/search/isbn?isbn=${encodeURIComponent(isbn)}`
            );
            return r.data.data as VolumeSearchResult;
        } catch (err) {
            if (isHttpError(err, 404)) return null;
            throw err;
        }
    },

    addToCollection: (apiId: string) =>
        api.post('/volumes', { api_id: apiId }),

    addBulk: (editionId: number, numbers: number[]) =>
        api.post('/volumes/bulk', { edition_id: editionId, numbers }),

    scanBulk: (isbns: string[]) =>
        api.post('/volumes/scan-bulk', { isbns }),

    bulkRemoveVolumes: (volumeIds: number[]) =>
        api.delete('/volumes/bulk', { data: { volume_ids: volumeIds } }),

    addBoxToCollection: (boxId: number, includeVolumes = true) =>
        api.post(`/boxes/${boxId}`, { include_volumes: includeVolumes }),

    removeBoxFromCollection: (boxId: number) =>
        api.delete(`/boxes/${boxId}`),

    getSeries: (id: number) =>
        api.get<ApiResponse<Series>>(`/series/${id}`)
            .then(r => r.data.data as Series),

    getEdition: (id: number) =>
        api.get<ApiResponse<Edition>>(`/editions/${id}`)
            .then(r => r.data.data as Edition),

    getBox: (id: number) =>
        api.get<ApiResponse<Box>>(`/boxes/${id}`)
            .then(r => r.data.data as Box),

    getBoxSet: (id: number) =>
        api.get<ApiResponse<BoxSet>>(`/box-sets/${id}`)
            .then(r => r.data.data as BoxSet),

    getEditionVolumes: (editionId: number) =>
        api.get<ApiResponse<Volume[]>>(`/editions/${editionId}/volumes`)
            .then(r => r.data.data as Volume[]),
};
