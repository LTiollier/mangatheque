'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2, Globe, Shield } from 'lucide-react';
import axios from 'axios';

export default function SettingsPage() {
    const { user, updateUser } = useAuth();

    const [username, setUsername] = useState(user?.username || '');
    const [isPublic, setIsPublic] = useState(user?.is_public || false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ username?: string[] }>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        try {
            const response = await api.put<{ data: typeof user }>('/user/settings', {
                username: username || null, // send null if string is empty
                is_public: isPublic,
            });

            if (response.data?.data) {
                updateUser(response.data.data);
                toast.success('Paramètres enregistrés avec succès');
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 422) {
                setErrors(error.response.data.errors);
            } else {
                toast.error('Erreur lors de la sauvegarde des paramètres');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8">Paramètres</h1>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Confidentialité
                        </CardTitle>
                        <CardDescription>
                            Gérez la visibilité de votre profil et de votre collection.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="username">Nom d&apos;utilisateur (Pseudo)</Label>
                            <Input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="ex: otaku_fan99"
                            />
                            {errors.username && (
                                <p className="text-sm text-red-500 mt-1">{errors.username[0]}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Ce nom sera utilisé pour votre lien de profil public si vous l&apos;activez.
                            </p>
                        </div>

                        <div className="flex items-center justify-between border rounded-lg p-4 bg-muted/30">
                            <div className="space-y-1 pr-4">
                                <Label htmlFor="public-profile" className="flex items-center gap-2 text-base">
                                    <Globe className="w-4 h-4" />
                                    Profil Public
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Si activé, toute personne connaissant votre pseudo pourra voir votre collection.
                                </p>
                            </div>
                            <Switch
                                id="public-profile"
                                checked={isPublic}
                                onCheckedChange={setIsPublic}
                            />
                        </div>

                        {isPublic && username && (
                            <div className="p-3 bg-blue-50/50 text-blue-700 rounded-md text-sm border border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/50">
                                <strong>Lien de votre profil: </strong>
                                <a
                                    href={`/user/${username}/collection`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline underline-offset-2 hover:text-blue-900 dark:hover:text-blue-100"
                                >
                                    {typeof window !== 'undefined' ? `${window.location.origin}/user/${username}/collection` : `/user/${username}/collection`}
                                </a>
                            </div>
                        )}

                        {isPublic && !username && (
                            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                                ⚠️ Vous devez définir un nom d&apos;utilisateur pour avoir un profil public.
                            </p>
                        )}
                    </CardContent>

                    <CardFooter className="bg-muted/30 flex justify-end">
                        <Button type="submit" disabled={isLoading || (isPublic && !username)}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Enregistrer
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
