import api, { ApiResponse } from '@/lib/api';
import { WishlistItem } from '@/types/manga';
import { WishlistItemSchema } from '@/schemas/manga';
import { z } from 'zod';

export const wishlistService = {
    /** Récupère la liste de souhaits (éditions et coffrets) */
    getAll: () =>
        api.get<ApiResponse<WishlistItem[]>>('/wishlist').then(r => {
            try {
                return z.array(WishlistItemSchema).parse(r.data.data) as WishlistItem[];
            } catch (error) {
                console.error('Wishlist validation failed:', error);
                return r.data.data as unknown as WishlistItem[];
            }
        }),

    /** Ajoute une édition par son ID local */
    addByEditionId: (editionId: number) =>
        api.post('/wishlist', { wishlist_id: editionId, wishlist_type: 'edition' }),

    /** Ajoute un coffret (box) par son ID local */
    addBox: (boxId: number) =>
        api.post('/wishlist', { wishlist_id: boxId, wishlist_type: 'box' }),

    /** Retire un item de la wishlist (type: 'edition' | 'box') */
    remove: (id: number, type: 'edition' | 'box') =>
        api.delete(`/wishlist/${id}`, { data: { wishlist_type: type } }),
};
