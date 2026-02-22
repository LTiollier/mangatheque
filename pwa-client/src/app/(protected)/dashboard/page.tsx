'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LucideLayoutDashboard, LucideBook, LucideHeart, LucideSettings } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const { user } = useAuth();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Welcome Card */}
            <div className="p-8 bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/20 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12 transition-transform duration-500 group-hover:rotate-0 group-hover:scale-[1.7]">
                    <LucideLayoutDashboard className="h-40 w-40 text-white" />
                </div>

                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2">Bienvenue, <span className="text-purple-400">{user?.name}</span> !</h2>
                    <p className="text-slate-400 max-w-xl">
                        Votre collection de mangas est à portée de main. Scannez de nouveaux tomes, gérez vos prêts et restez à jour.
                    </p>
                    <div className="flex gap-4 mt-8">
                        <Button asChild className="bg-white text-slate-950 hover:bg-slate-200 font-bold rounded-xl px-6">
                            <Link href="/collection">Ma Collection</Link>
                        </Button>
                        <Button asChild variant="outline" className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 rounded-xl px-6">
                            <Link href="/search">Rechercher</Link>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Quick Stats/Actions */}
                <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <LucideBook className="h-6 w-6 text-blue-400" />
                        </div>
                        <h3 className="font-bold">Ma Collection</h3>
                    </div>
                    <p className="text-4xl font-black mb-2">0</p>
                    <p className="text-slate-500 text-sm">Mangas enregistrés</p>
                </div>

                <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-pink-500/10 rounded-xl">
                            <LucideHeart className="h-6 w-6 text-pink-400" />
                        </div>
                        <h3 className="font-bold">Wishlist</h3>
                    </div>
                    <p className="text-4xl font-black mb-2">0</p>
                    <p className="text-slate-500 text-sm">Tombeurs de portefeuille</p>
                </div>

                <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-slate-800 rounded-xl">
                            <LucideSettings className="h-6 w-6 text-slate-400" />
                        </div>
                        <h3 className="font-bold">Paramètres</h3>
                    </div>
                    <p className="text-slate-500 text-sm mb-6">Gérez votre profil et vos préférences.</p>
                    <Button variant="outline" className="w-full border-slate-800 hover:bg-slate-800 rounded-xl">
                        Modifier le profil
                    </Button>
                </div>
            </div>
        </div>
    );
}
