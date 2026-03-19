import api, { ApiResponse } from '@/lib/api';
import { WishlistItem } from '@/types/manga';
import { WishlistItemSchema } from '@/schemas/manga';
import { z } from 'zod';

export const wishlistService = {
    getAll: () =>
        api.get<ApiResponse<WishlistItem[]>>('/wishlist')
            .then(r => z.array(WishlistItemSchema).parse(r.data.data) as WishlistItem[]),

    addByEditionId: (editionId: number) =>
        api.post('/wishlist', { edition_id: editionId }),

    // Note: requires API support for box_set_id field
    addByBoxSetId: (boxSetId: number) =>
        api.post('/wishlist', { box_set_id: boxSetId }),

    add: (apiId: string) =>
        api.post('/wishlist', { api_id: apiId }),

    remove: (id: number, type: 'edition' | 'box' | 'box_set') =>
        api.delete(`/wishlist/${id}`, { data: { type } }),
};
