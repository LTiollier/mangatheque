import api from '@/lib/api';
import { Manga } from '@/types/manga';

export const wishlistService = {
    /** Récupère la liste de souhaits de l'utilisateur */
    getAll: () =>
        api.get<{ data: Manga[] }>('/wishlist').then(r => r.data.data),

    /** Ajoute un manga à la liste de souhaits via son api_id */
    add: (apiId: string) =>
        api.post('/wishlist', { api_id: apiId }),

    /** Retire un manga de la liste de souhaits */
    remove: (mangaId: string) =>
        api.delete(`/wishlist/${mangaId}`),
};
