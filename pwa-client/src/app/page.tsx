'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LucideBookOpen, LucideLogOut, LucideUser, LucideSparkles, LucidePlusCircle, LucideSearch } from 'lucide-react';

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(126,34,206,0.15),transparent_50%)] pointer-events-none"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>

      <main className="relative z-10 w-full max-w-4xl text-center space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex justify-center mb-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative p-5 bg-slate-900 rounded-3xl ring-1 ring-slate-800 backdrop-blur-xl">
              <LucideBookOpen className="h-14 w-14 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white">
            MANGA<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-400">THÈQUE</span>
          </h1>
          <div className="flex items-center justify-center gap-2 text-purple-400 font-medium tracking-widest uppercase text-xs">
            <LucideSparkles className="h-3 w-3" />
            <span>Votre collection, votre univers</span>
            <LucideSparkles className="h-3 w-3" />
          </div>
        </div>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
          L'outil ultime pour les collectionneurs. Suivez vos séries, gérez vos lectures et ne manquez plus jamais un tome.
        </p>

        <div className="flex flex-col items-center justify-center gap-6 mt-16 w-full">
          {isAuthenticated ? (
            <div className="space-y-8 w-full max-w-md">
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl blur-sm opacity-50"></div>
                <div className="relative p-6 bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-2xl flex items-center gap-5 shadow-2xl transition-all duration-300 group-hover:border-slate-700">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-300">
                    <LucideUser className="h-7 w-7" />
                  </div>
                  <div className="text-left">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Session Active</p>
                    <p className="text-white font-extrabold text-xl">{user?.name}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <Button className="h-14 bg-white text-slate-950 hover:bg-slate-200 font-black rounded-2xl transition-all active:scale-95 shadow-xl shadow-white/5 flex items-center gap-2">
                  <LucideSearch className="h-5 w-5 outline-none" />
                  Collection
                </Button>
                <Button
                  variant="outline"
                  onClick={logout}
                  className="h-14 border-slate-800 bg-slate-900/50 text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 rounded-2xl transition-all active:scale-95 flex items-center gap-2"
                >
                  <LucideLogOut className="h-5 w-5" />
                  <span>Quitter</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button asChild className="group h-14 px-8 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl transition-all active:scale-95 shadow-2xl shadow-purple-500/10 relative overflow-hidden">
                <Link href="/login" className="flex items-center gap-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
                  <span>Commencer</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-14 px-8 border-slate-700 bg-slate-900/40 text-white hover:bg-slate-800 font-bold rounded-2xl transition-all active:scale-95 backdrop-blur-md">
                <Link href="/register">Créer un profil</Link>
              </Button>
            </div>
          )}
        </div>
      </main>

      <footer className="absolute bottom-8 w-full px-4 flex flex-col items-center gap-2">
        <div className="h-px w-12 bg-slate-800"></div>
        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
          © 2026 Mangathèque • Built for collectors
        </p>
      </footer>

      <style jsx global>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
