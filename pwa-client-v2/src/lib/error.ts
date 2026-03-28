import { ApiError } from './api';

export function getApiErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof ApiError) {
        const data = error.data as Record<string, unknown> | null;
        return (
            (data?.message as string | undefined) ??
            (data?.error as string | undefined) ??
            fallback
        );
    }
    if (error instanceof Error) return error.message;
    return fallback;
}

export function isHttpError(error: unknown, status: number): boolean {
    return error instanceof ApiError && error.status === status;
}

export function getValidationErrors(error: unknown): Record<string, string[]> {
    if (error instanceof ApiError && error.status === 422) {
        const data = error.data as Record<string, unknown> | null;
        return (data?.errors as Record<string, string[]> | undefined) ?? {};
    }
    return {};
}
