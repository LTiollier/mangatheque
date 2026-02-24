import api, { ApiResponse } from '@/lib/api';
import { Loan } from '@/types/manga';
import { LoanSchema } from '@/schemas/manga';
import { z } from 'zod';

export const loanService = {
    /** Récupère tous les prêts de l'utilisateur */
    getAll: () =>
        api.get<ApiResponse<Loan[]>>('/loans').then(r => {
            try {
                return z.array(LoanSchema).parse(r.data.data);
            } catch (error) {
                console.error("Loan validation failed:", error);
                return r.data.data as unknown as Loan[];
            }
        }),

    /** Déclare un prêt pour un volume unique */
    create: (volumeId: number, borrowerName: string, notes?: string | null) =>
        api.post('/loans', { volume_id: volumeId, borrower_name: borrowerName, notes: notes ?? null }),

    /** Déclare un prêt groupé pour plusieurs volumes (transactionnel) */
    createBulk: (volumeIds: number[], borrowerName: string, notes?: string | null) =>
        api.post<ApiResponse<Loan[]>>('/loans/bulk', {
            volume_ids: volumeIds,
            borrower_name: borrowerName,
            notes: notes ?? null
        }).then(r => {
            try {
                return z.array(LoanSchema).parse(r.data.data);
            } catch (error) {
                console.error("Bulk loan validation failed:", error);
                return r.data.data as unknown as Loan[];
            }
        }),

    /** Marque un volume comme rendu */
    markReturned: (volumeId: number) =>
        api.post('/loans/return', { volume_id: volumeId }),

    /** Marque plusieurs volumes comme rendus (transactionnel) */
    markManyReturned: (volumeIds: number[]) =>
        api.post<ApiResponse<Loan[]>>('/loans/return/bulk', {
            volume_ids: volumeIds
        }).then(r => {
            try {
                return z.array(LoanSchema).parse(r.data.data);
            } catch (error) {
                console.error("Return bulk loan validation failed:", error);
                return r.data.data as unknown as Loan[];
            }
        }),
};
