"use client";

import { useState, useCallback } from "react";
import { Loan } from "@/types/manga";
import { toast } from "sonner";
import { loanService } from "@/services/loan.service";

interface UseLoansReturn {
    loans: Loan[];
    isLoading: boolean;
    fetchLoans: () => Promise<void>;
    handleReturn: (volumeId: number) => Promise<void>;
    handleBulkReturn: (volumeIds: number[]) => Promise<void>;
}

export function useLoans(): UseLoansReturn {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLoans = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await loanService.getAll();
            setLoans(data);
        } catch (error) {
            toast.error("Erreur lors de la récupération des prêts");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleReturn = useCallback(async (volumeId: number) => {
        try {
            await loanService.markReturned(volumeId);
            toast.success("Manga marqué comme rendu");
            await fetchLoans();
        } catch (error) {
            toast.error("Erreur lors de la validation du rendu");
            console.error(error);
        }
    }, [fetchLoans]);

    const handleBulkReturn = useCallback(async (volumeIds: number[]) => {
        if (volumeIds.length === 0) return;
        try {
            await loanService.markManyReturned(volumeIds);
            toast.success("Mangas marqués comme rendus");
            await fetchLoans();
        } catch (error) {
            toast.error("Erreur lors de la validation du rendu");
            console.error(error);
        }
    }, [fetchLoans]);

    return { loans, isLoading, fetchLoans, handleReturn, handleBulkReturn };
}
