import api, { ApiResponse } from '@/lib/api';
import { Loan } from '@/types/volume';
import { LoanSchema } from '@/schemas/volume';
import { z } from 'zod';

export const loanService = {
    getAll: () =>
        api.get<ApiResponse<Loan[]>>('/loans')
            .then(r => z.array(LoanSchema).parse(r.data.data) as Loan[]),

    create: (id: number, type: 'volume' | 'box', borrowerName: string) =>
        api.post('/loans', {
            loanable_id: id,
            loanable_type: type,
            borrower_name: borrowerName,
        }),

    createBulk: (volumeIds: number[], borrowerName: string) =>
        api.post<ApiResponse<Loan[]>>('/loans/bulk', {
            volume_ids: volumeIds,
            borrower_name: borrowerName,
        }).then(r => z.array(LoanSchema).parse(r.data.data) as Loan[]),

    markReturned: (id: number, type: 'volume' | 'box') =>
        api.post('/loans/return', { loanable_id: id, loanable_type: type }),

    markManyReturned: (items: { id: number, type: 'volume' | 'box' }[]) =>
        api.post<ApiResponse<Loan[]>>('/loans/return/bulk', { items })
            .then(r => z.array(LoanSchema).parse(r.data.data) as Loan[]),
};
