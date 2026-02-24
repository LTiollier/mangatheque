'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Manga } from '@/types/manga';
import { Loader2, User as UserIcon } from 'lucide-react';
import axios from 'axios';

interface Profile {
    id: number;
    name: string;
    username: string;
}

interface PublicCollectionContextType {
    profile: Profile | null;
    mangas: Manga[];
    isLoading: boolean;
    error: string | null;
}

const PublicCollectionContext = createContext<PublicCollectionContextType | undefined>(undefined);

export const usePublicCollection = () => {
    const context = useContext(PublicCollectionContext);
    if (!context) {
        throw new Error('usePublicCollection must be used within a PublicCollectionLayout');
    }
    return context;
};

export default function PublicCollectionLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const username = params.username as string;

    const [mangas, setMangas] = useState<Manga[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPublicProfile = async () => {
            try {
                // Fetch profile
                const profileRes = await api.get(`/users/${username}`);
                setProfile(profileRes.data.data);

                // Fetch collection (all mangas for now, we'll filter client side if needed, or fetch per view)
                // Actually, the backend might have specific endpoints. 
                // Currently, we fetch the whole collection.
                const collectionRes = await api.get(`/users/${username}/collection`);
                setMangas(collectionRes.data.data);
            } catch (err: unknown) {
                if (axios.isAxiosError(err) && err.response?.status === 404) {
                    setError('Profil introuvable ou privé.');
                } else {
                    setError('Erreur lors du chargement de la collection.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (username) {
            fetchPublicProfile();
        }
    }, [username]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4 text-center">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 max-w-md w-full">
                    <UserIcon className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                    <h1 className="text-xl font-bold mb-2">Oops !</h1>
                    <p className="text-slate-400">{error || 'Une erreur est survenue'}</p>
                </div>
            </div>
        );
    }

    return (
        <PublicCollectionContext.Provider value={{ profile, mangas, isLoading, error }}>
            <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
                        <div className="w-16 h-16 bg-purple-500/10 rounded-full border border-purple-500/20 flex items-center justify-center">
                            <UserIcon className="w-8 h-8 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tight">Collection de {profile.username}</h1>
                            <p className="text-slate-400">{mangas.length} serie(s) dans la bibliothèque</p>
                        </div>
                    </div>

                    {children}
                </div>
            </div>
        </PublicCollectionContext.Provider>
    );
}
