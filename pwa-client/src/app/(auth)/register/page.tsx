'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LucideChevronLeft, LucideUserPlus, LucideMail, LucideLock, LucideUser, LucideLoader2, LucideAlertCircle } from 'lucide-react';
import axios from 'axios';

import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const registerSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  email: z.string().email({ message: "Veuillez entrer une adresse email valide." }),
  password: z.string().min(8, { message: "Le mot de passe doit contenir au moins 8 caractères." }),
  password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["password_confirmation"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const { login } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  async function onSubmit(data: RegisterFormValues) {
    setError(null);
    try {
      const { user, token } = await authService.register(data);

      // Update auth state
      login(user, token);

      // Redirect to callbackUrl or home
      router.push(callbackUrl);
      router.refresh();
    } catch (err: unknown) {
      console.error('Registration failed:', err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Une erreur est survenue lors de l'inscription. Veuillez réessayer.");
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[conic-gradient(at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-6 md:p-8">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 transition-all duration-500 animate-in fade-in zoom-in slide-in-from-bottom-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-white mb-6 transition-colors group"
        >
          <LucideChevronLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Retour à l&apos;accueil
        </Link>

        <Card className="border-slate-800 bg-slate-950/80 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"></div>

          <CardHeader className="space-y-1 pb-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-purple-500/10 rounded-2xl ring-1 ring-purple-500/20">
                <LucideUserPlus className="h-8 w-8 text-purple-400" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-white">Créer un compte</CardTitle>
            <CardDescription className="text-slate-400">
              Rejoignez Mangathèque et commencez votre collection
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                <LucideAlertCircle className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-slate-200">Nom / Pseudo</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <LucideUser className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                          <Input
                            placeholder="Ex: San Goku"
                            className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-purple-500 hover:border-slate-600 transition-colors"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-pink-400 shrink-0" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-slate-200">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <LucideMail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                          <Input
                            type="email"
                            placeholder="manga@example.com"
                            className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-purple-500 hover:border-slate-600 transition-colors"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-pink-400" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-slate-200">Mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <LucideLock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                              type="password"
                              placeholder="••••••••"
                              className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-purple-500 hover:border-slate-600 transition-colors"
                              {...field}
                            />
                          </div>
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
                        <FormLabel className="text-slate-200">Confirmation</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <LucideLock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                              type="password"
                              placeholder="••••••••"
                              className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-purple-500 hover:border-slate-600 transition-colors"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-pink-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold h-11 transition-all duration-200 active:scale-[0.98] mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    "S'inscrire"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 border-t border-slate-800/50 bg-slate-900/30 py-6">
            <div className="text-sm text-center text-slate-400">
              Vous avez déjà un compte ?{' '}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium hover:underline transition-all">
                Se connecter
              </Link>
            </div>
          </CardFooter>
        </Card>

        <p className="mt-8 text-center text-xs text-slate-500">
          En vous inscrivant, vous acceptez nos{' '}
          <a href="#" className="underline hover:text-slate-300">Conditions d&apos;Utilisation</a> et notre{' '}
          <a href="#" className="underline hover:text-slate-300">Politique de Confidentialité</a>.
        </p>
      </div>
    </div>
  );
}
