"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { LucideChevronLeft, LucideLock, LucideLoader2, LucideAlertCircle, LucideCheckCircle2 } from "lucide-react";

import { authService } from "@/services/auth.service";
import { getApiErrorMessage } from "@/lib/error";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const resetPasswordSchema = z.object({
    token: z.string().min(1),
    email: z.string().email({ message: "Veuillez entrer une adresse email valide." }),
    password: z.string().min(8, { message: "Le mot de passe doit faire au moins 8 caractères." }),
    password_confirmation: z.string().min(1, { message: "La confirmation est requise." }),
}).refine((data) => data.password === data.password_confirmation, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["password_confirmation"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [message, setMessage] = useState<string | null>(null);

    const form = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            token: searchParams.get("token") || "",
            email: searchParams.get("email") || "",
            password: "",
            password_confirmation: "",
        },
    });

    useEffect(() => {
        const token = searchParams.get("token");
        const email = searchParams.get("email");
        if (token) form.setValue("token", token);
        if (email) form.setValue("email", email);
    }, [searchParams, form]);

    const isLoading = form.formState.isSubmitting;

    async function onSubmit(data: ResetPasswordValues) {
        setStatus("idle");
        setMessage(null);
        try {
            await authService.resetPassword(data);
            setStatus("success");
            setMessage("Votre mot de passe a été réinitialisé avec succès.");
        } catch (err: unknown) {
            console.error("Reset password failed:", err);
            setStatus("error");
            setMessage(getApiErrorMessage(err, "Une erreur est survenue lors de la réinitialisation."));
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[conic-gradient(at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-6 md:p-8">
            <div className="absolute inset-0 bg-[url('/patterns/cubes.png')] opacity-20 pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10 transition-all duration-500 animate-in fade-in zoom-in slide-in-from-bottom-8">
                <Link
                    href="/login"
                    className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-white mb-6 transition-colors group"
                >
                    <LucideChevronLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Retour à la connexion
                </Link>

                <Card className="border-slate-800 bg-slate-950/80 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"></div>

                    <CardHeader className="space-y-1 pb-6 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-blue-500/10 rounded-2xl ring-1 ring-blue-500/20">
                                <LucideLock className="h-8 w-8 text-blue-400" />
                            </div>
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight text-white">Nouveau mot de passe</CardTitle>
                        <CardDescription className="text-slate-400">
                            Choisissez un mot de passe robuste d&apos;au moins 8 caractères
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {status === "success" ? (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex flex-col items-center text-center gap-3 animate-in zoom-in-95 duration-300">
                                <LucideCheckCircle2 className="h-12 w-12 text-emerald-400" />
                                <div className="space-y-1">
                                    <h3 className="font-bold text-emerald-400 text-lg">C&apos;est tout bon !</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        Votre mot de passe a été mis à jour. Vous pouvez maintenant vous connecter.
                                    </p>
                                </div>
                                <Button asChild className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                                    <Link href="/login">Se connecter</Link>
                                </Button>
                            </div>
                        ) : (
                            <>
                                {status === "error" && (
                                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                                        <LucideAlertCircle className="h-5 w-5 shrink-0" />
                                        <p>{message}</p>
                                    </div>
                                )}
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem className="space-y-2">
                                                    <FormLabel className="text-slate-200">Email</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="email"
                                                            placeholder="manga@example.com"
                                                            className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 hover:border-slate-600 transition-colors"
                                                            {...field}
                                                            readOnly={!!searchParams.get("email")}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-pink-400" />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem className="space-y-2">
                                                    <FormLabel className="text-slate-200">Nouveau mot de passe</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="password"
                                                            placeholder="••••••••"
                                                            className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 hover:border-slate-600 transition-colors"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-pink-400" />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="password_confirmation"
                                            render={({ field }) => (
                                                <FormItem className="space-y-2">
                                                    <FormLabel className="text-slate-200">Confirmer le mot de passe</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="password"
                                                            placeholder="••••••••"
                                                            className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 hover:border-slate-600 transition-colors"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-pink-400" />
                                                </FormItem>
                                            )}
                                        />

                                        <Button
                                            type="submit"
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11 transition-all duration-200 active:scale-[0.98] mt-4"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Réinitialisation...
                                                </>
                                            ) : (
                                                "Mettre à jour le mot de passe"
                                            )}
                                        </Button>
                                    </form>
                                </Form>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
