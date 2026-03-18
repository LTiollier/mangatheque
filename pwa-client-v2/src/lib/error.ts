import axios from 'axios';

export function getApiErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
        return (
            error.response?.data?.message ??
            error.response?.data?.error ??
            fallback
        );
    }
    if (error instanceof Error) return error.message;
    return fallback;
}

export function isHttpError(error: unknown, status: number): boolean {
    return axios.isAxiosError(error) && error.response?.status === status;
}

export function getValidationErrors(error: unknown): Record<string, string[]> {
    if (axios.isAxiosError(error) && error.response?.status === 422) {
        return error.response.data?.errors ?? {};
    }
    return {};
}
