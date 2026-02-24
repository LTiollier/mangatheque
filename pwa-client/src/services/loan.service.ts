import api from '@/lib/api';
import { Loan } from '@/types/manga';

export const loanService = {
    /** Récupère tous les prêts de l'utilisateur */
    getAll: () =>
        api.get<{ data: Loan[] }>('/loans').then(r => r.data.data),

    /** Déclare un prêt pour un ou plusieurs volumes */
    create: (volumeId: number, borrowerName: string, notes?: string | null) =>
        api.post('/loans', { volume_id: volumeId, borrower_name: borrowerName, notes: notes ?? null }),

    /** Marque un volume comme rendu */
    markReturned: (volumeId: number) =>
        api.post('/loans/return', { volume_id: volumeId }),

    /** Marque plusieurs volumes comme rendus en parallèle */
    markManyReturned: (volumeIds: number[]) =>
        Promise.all(volumeIds.map(id => loanService.markReturned(id))),
};
