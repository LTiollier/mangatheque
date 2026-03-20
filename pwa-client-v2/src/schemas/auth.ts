import { z } from "zod";

export const UserSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
    username: z.string().nullable(),
    is_public: z.boolean(),
});

export const AuthResponseSchema = z.object({
    user: UserSchema,
    token: z.string(),
});

export type ValidatedUser = z.infer<typeof UserSchema>;
export type ValidatedAuthResponse = z.infer<typeof AuthResponseSchema>;
