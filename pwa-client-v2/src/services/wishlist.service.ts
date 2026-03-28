import api, { ApiResponse } from '@/lib/api';
import { WishlistItem } from '@/types/volume';

export const wishlistService = {
    getAll: () =>
        api.get<ApiResponse<WishlistItem[]>>('/wishlist')
            .then(r => r.data.data as WishlistItem[]),

    getStats: () =>
        api.get<{ data: { total_volumes: number } }>('/wishlist/stats')
            .then(r => r.data.data),

    add: (id: number, type: 'edition' | 'box') =>
        api.post('/wishlist', { wishlist_id: id, wishlist_type: type }),

    addByApiId: (apiId: string) =>
        api.post('/wishlist', { api_id: apiId }),

    remove: (id: number, type: 'edition' | 'box') =>
        api.delete(`/wishlist/${id}`, { data: { wishlist_type: type } }),
};
