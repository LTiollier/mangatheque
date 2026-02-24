import { z } from "zod";

/**
 * Schéma de validation pour l'objet User
 */
export const UserSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
    username: z.string().nullable(),
    is_public: z.boolean(),
});

/**
 * Schéma de validation pour les réponses d'authentification (Login/Register)
 */
export const AuthResponseSchema = z.object({
    user: UserSchema,
});

export type ValidatedUser = z.infer<typeof UserSchema>;
export type ValidatedAuthResponse = z.infer<typeof AuthResponseSchema>;
