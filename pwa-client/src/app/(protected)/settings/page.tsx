'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2, Globe, Shield, Settings as LucideSettings } from 'lucide-react';
import { userService } from '@/services/user.service';
import { getApiErrorMessage, getValidationErrors } from '@/lib/error';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const settingsSchema = z.object({
    username: z.string()
        .min(3, 'Le pseudo doit faire au moins 3 caractères')
        .max(20, 'Le pseudo ne peut pas dépasser 20 caractères')
        .regex(/^[a-zA-Z0-9_]+$/, 'Seuls les lettres, chiffres et underscores sont autorisés')
        .or(z.literal('')),
    is_public: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
    const { user, updateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            username: user?.username || '',
            is_public: user?.is_public || false,
        },
    });

    const isPublic = watch('is_public');
    const username = watch('username');

    const onSubmit = async (data: SettingsFormValues) => {
        setIsLoading(true);

        try {
            const updatedUser = await userService.updateSettings({
                username: data.username || null,
                is_public: data.is_public,
            });

            if (updatedUser) {
                updateUser(updatedUser);
                toast.success('Paramètres enregistrés avec succès');
            }
        } catch (error: unknown) {
            const validationErrors = getValidationErrors(error);
            if (Object.keys(validationErrors).length > 0) {
                // Handle API validation errors if any
                toast.error('Certaines données sont invalides');
            } else {
                toast.error(getApiErrorMessage(error, 'Erreur lors de la mise à jour des paramètres'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto">
            {/* Header Section */}
            <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider">
                    <LucideSettings className="h-3 w-3" />
                    Configuration
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                    Paramètres
                </h1>
                <p className="text-slate-400 font-medium">
                    Gérez vos préférences et la visibilité de votre profil.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card className="bg-slate-900 border-slate-800 overflow-hidden">
                    <CardHeader className="border-b border-slate-800 bg-slate-900/50">
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Shield className="w-5 h-5 text-purple-400" />
                            Confidentialité
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Gérez la visibilité de votre profil et de votre collection.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-6">
                        <div className="space-y-3">
                            <Label htmlFor="username" className="text-slate-200 font-bold">Nom d&apos;utilisateur (Pseudo)</Label>
                            <Input
                                id="username"
                                type="text"
                                {...register('username')}
                                placeholder="ex: otaku_fan99"
                                className="bg-slate-950 border-slate-800 focus:ring-purple-500/20 rounded-xl"
                            />
                            {errors.username && (
                                <p className="text-sm text-red-400 mt-1 font-medium">{errors.username.message}</p>
                            )}
                            <p className="text-xs text-slate-500">
                                Ce nom sera utilisé pour votre lien de profil public si vous l&apos;activez.
                            </p>
                        </div>

                        <div className="flex items-center justify-between border border-slate-800 rounded-2xl p-5 bg-slate-950/50">
                            <div className="space-y-1 pr-4">
                                <Label htmlFor="public-profile" className="flex items-center gap-2 text-base text-white font-bold">
                                    <Globe className="w-4 h-4 text-purple-400" />
                                    Profil Public
                                </Label>
                                <p className="text-sm text-slate-500">
                                    Si activé, toute personne connaissant votre pseudo pourra voir votre collection.
                                </p>
                            </div>
                            <Switch
                                id="public-profile"
                                checked={isPublic}
                                onCheckedChange={(val) => setValue('is_public', val)}
                                className="data-[state=checked]:bg-purple-600"
                            />
                        </div>

                        {isPublic && username && (
                            <div className="p-4 bg-purple-500/5 text-purple-200 rounded-2xl text-sm border border-purple-500/10">
                                <strong className="text-purple-400">Lien de votre profil : </strong>
                                <a
                                    href={`/user/${username}/collection`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline underline-offset-4 hover:text-white transition-colors break-all"
                                >
                                    {typeof window !== 'undefined' ? `${window.location.origin}/user/${username}/collection` : `/user/${username}/collection`}
                                </a>
                            </div>
                        )}

                        {isPublic && !username && (
                            <div className="p-4 bg-amber-500/5 text-amber-400 rounded-2xl text-sm border border-amber-500/10 font-medium">
                                ⚠️ Vous devez définir un nom d&apos;utilisateur pour avoir un profil public.
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="bg-slate-950/50 border-t border-slate-800 px-6 py-4 flex justify-end">
                        <Button
                            type="submit"
                            disabled={isLoading || (isPublic && !username)}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl px-8"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Enregistrer les modifications
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
