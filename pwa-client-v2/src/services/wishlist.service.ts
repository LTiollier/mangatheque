import api, { ApiResponse } from '@/lib/api';
import { WishlistItem } from '@/types/manga';
import { WishlistItemSchema } from '@/schemas/manga';
import { z } from 'zod';

export const wishlistService = {
    getAll: () =>
        api.get<ApiResponse<WishlistItem[]>>('/wishlist')
            .then(r => z.array(WishlistItemSchema).parse(r.data.data) as WishlistItem[]),

    add: (id: number, type: 'edition' | 'box') =>
        api.post('/wishlist', { wishlist_id: id, wishlist_type: type }),

    addByApiId: (apiId: string) =>
        api.post('/wishlist', { api_id: apiId }),

    remove: (id: number, type: 'edition' | 'box') =>
        api.delete(`/wishlist/${id}`, { data: { wishlist_type: type } }),
};
