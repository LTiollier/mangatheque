'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
    ChevronLeft, 
    LogIn, 
    Mail, 
    Lock, 
    Loader2, 
    AlertCircle,
    BookOpen,
    Library
} from 'lucide-react';
import { motion } from 'framer-motion';

import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { getApiErrorMessage, isHttpError } from '@/lib/error';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
    email: z.string().email({ message: "Veuillez entrer une adresse email valide." }),
    password: z.string().min(1, { message: "Le mot de passe est requis." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';
    const { login } = useAuth();
    const [error, setError] = React.useState<string | null>(null);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const isLoading = form.formState.isSubmitting;

    async function onSubmit(data: LoginFormValues) {
        setError(null);
        try {
            const { user } = await authService.login(data);
            login(user);
            router.push(callbackUrl);
            router.refresh();
        } catch (err: unknown) {
            console.error('Login failed:', err);
            if (isHttpError(err, 401)) {
                setError("Identifiants incorrects. Veuillez réessayer.");
            } else {
                setError(getApiErrorMessage(err, "Une erreur est survenue lors de la connexion."));
            }
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 bg-manga-dots opacity-10 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[440px] relative z-10"
            >
                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Link
                        href="/"
                        className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-white mb-8 transition-colors group"
                    >
                        <ChevronLeft className="mr-2 h-3 w-3 transition-transform group-hover:-translate-x-1" />
                        Retour au portail
                    </Link>
                </motion.div>

                {/* Login Card */}
                <div className="premium-glass p-8 md:p-10 rounded-[2.5rem] border-2 border-border/50 relative overflow-hidden">
                    {/* Top Decorative bar */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
                    
                    <div className="flex flex-col items-center text-center space-y-6 mb-10">
                        <motion.div 
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="p-4 bg-primary/10 rounded-2xl border-2 border-primary/20 shadow-xl shadow-primary/5"
                        >
                            <Library className="h-10 w-10 text-primary" />
                        </motion.div>
                        
                        <div className="space-y-2">
                            <h1 className="text-5xl font-display font-black uppercase tracking-tight text-white leading-none">
                                Connexion
                            </h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                Accédez à votre bibliothèque personnelle
                            </p>
                        </div>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-8 p-4 bg-destructive/10 border-2 border-destructive/20 rounded-2xl flex items-center gap-4 text-destructive text-xs font-bold"
                        >
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p className="uppercase tracking-wide">{error}</p>
                        </motion.div>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Adresse Email</FormLabel>
                                        </div>
                                        <FormControl>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    type="email"
                                                    placeholder="manga@bibliotheque.com"
                                                    className="h-14 pl-12 bg-background/50 border-2 border-border/50 text-white placeholder:text-muted-foreground/30 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all rounded-xl font-medium"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[10px] font-bold text-primary uppercase italic" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mot de passe</FormLabel>
                                            <Link
                                                href="/forgot-password"
                                                className="text-[10px] font-bold text-primary hover:text-primary focus:underline transition-all uppercase tracking-widest"
                                            >
                                                Oublié ?
                                            </Link>
                                        </div>
                                        <FormControl>
                                            <div className="relative group">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••••••"
                                                    className="h-14 pl-12 bg-background/50 border-2 border-border/50 text-white placeholder:text-muted-foreground/30 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all rounded-xl font-medium"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[10px] font-bold text-primary uppercase italic" />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 mt-4 group"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        Se Connecter
                                        <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </span>
                                )}
                            </Button>
                        </form>
                    </Form>
                </div>

                {/* Footer Actions */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-10 flex flex-col items-center space-y-4"
                >
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        Pas encore inscrit ?
                    </p>
                    <Button variant="ghost" asChild className="text-white hover:text-primary hover:bg-primary/5 font-black uppercase tracking-widest text-[11px] h-auto py-3 px-8 rounded-full border border-border/50 transition-all">
                        <Link href="/register">Créer un compte bibliothèque</Link>
                    </Button>
                </motion.div>
            </motion.div>

            {/* Background Corner Accents */}
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] aspect-square bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-[-10%] left-[-10%] w-[30%] aspect-square bg-secondary/5 blur-[120px] rounded-full pointer-events-none" />
        </div>
    );
}
