import axios from 'axios';

/**
 * Extrait un message d'erreur lisible depuis une erreur inconnue.
 *
 * Priorité :
 *  1. `error.response.data.message` (réponse API avec message)
 *  2. `error.response.data.error` (réponse API avec champ "error")
 *  3. `error.message` (erreur JS standard)
 *  4. `fallback` (message par défaut fourni par l'appelant)
 */
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

/**
 * Retourne true si l'erreur est une erreur HTTP avec le statut donné.
 */
export function isHttpError(error: unknown, status: number): boolean {
    return axios.isAxiosError(error) && error.response?.status === status;
}

/**
 * Retourne les erreurs de validation Laravel (422) sous forme d'objet.
 * Utile pour afficher des erreurs champ par champ.
 */
export function getValidationErrors(error: unknown): Record<string, string[]> {
    if (axios.isAxiosError(error) && error.response?.status === 422) {
        return error.response.data?.errors ?? {};
    }
    return {};
}
