import api, { ApiResponse } from '@/lib/api';
import { Loan } from '@/types/volume';
import { LoanSchema } from '@/schemas/volume';
import { z } from 'zod';

export const loanService = {
    getAll: () =>
        api.get<ApiResponse<Loan[]>>('/loans')
            .then(r => z.array(LoanSchema).parse(r.data.data) as Loan[]),

    create: (items: { type: 'volume' | 'box'; id: number }[], borrowerName: string) =>
        api.post<ApiResponse<Loan>>('/loans', { items, borrower_name: borrowerName })
            .then(r => LoanSchema.parse(r.data.data) as Loan),

    markReturned: (loanId: number) =>
        api.post<ApiResponse<Loan>>(`/loans/${loanId}/return`)
            .then(r => LoanSchema.parse(r.data.data) as Loan),

    markManyReturned: (loanIds: number[]) =>
        api.post<ApiResponse<Loan[]>>('/loans/return/bulk', { loan_ids: loanIds })
            .then(r => z.array(LoanSchema).parse(r.data.data) as Loan[]),
};
