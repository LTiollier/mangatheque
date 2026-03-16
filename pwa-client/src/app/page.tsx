'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LucideBookOpen, LucideLogOut, LucideUser, LucideSparkles, LucideSearch } from 'lucide-react';

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
  <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden bg-manga-dots">
      {/* Background Decorative Elements */}
   <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,var(--color-primary),transparent_50%)] opacity-5 pointer-events-none"></div>
   <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
   <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

   <main className="relative z-10 w-full max-w-4xl text-center space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
    <div className="flex justify-center mb-8">
     <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-primary to-orange-500 rounded-3xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative p-5 bg-card rounded-3xl ring-2 ring-border backdrop-blur-xl">
       <LucideBookOpen className="h-14 w-14 text-primary" />
            </div>
          </div>
        </div>

    <div className="space-y-4">
     <h1 className="text-7xl md:text-9xl font-display tracking-tight text-foreground uppercase">
      MANGA<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-500 to-secondary">THÈQUE</span>
          </h1>
     <div className="flex items-center justify-center gap-2 text-primary font-black tracking-[0.3em] uppercase text-xs">
      <LucideSparkles className="h-3 w-3" />
            <span>Votre collection • Votre univers</span>
      <LucideSparkles className="h-3 w-3" />
          </div>
        </div>

    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
          L&apos;outil ultime pour les collectionneurs. Suivez vos séries, gérez vos lectures et ne manquez plus jamais un tome.
        </p>

    <div className="flex flex-col items-center justify-center gap-6 mt-16 w-full">
          {isAuthenticated ? (
      <div className="space-y-8 w-full max-w-md">
       <div className="group relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-md opacity-50"></div>
        <div className="relative p-6 bg-card/80 backdrop-blur-2xl border-2 border-border rounded-2xl flex items-center gap-5 shadow-2xl transition-all duration-300 group-hover:border-primary/50">
         <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white shadow-lg shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform duration-300">
          <LucideUser className="h-7 w-7" />
                  </div>
         <div className="text-left">
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-wider">Session Active</p>
          <p className="text-foreground font-black text-2xl font-display">{user?.name}</p>
                  </div>
                </div>
              </div>

       <div className="grid grid-cols-2 gap-4 w-full">
        <Button asChild className="h-16 bg-primary text-primary-foreground hover:bg-primary/90 font-black rounded-xl transition-all active:scale-95 shadow-xl shadow-primary/20 flex items-center gap-2 text-lg uppercase tracking-wider">
         <Link href="/dashboard" className="flex items-center gap-2 w-full h-full justify-center">
          <LucideSearch className="h-5 w-5" />
                    Explorer
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={logout}
         className="h-16 border-2 border-border bg-card/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 rounded-xl transition-all active:scale-95 flex items-center gap-2 text-lg uppercase tracking-wider"
                >
         <LucideLogOut className="h-5 w-5" />
                  <span>Quitter</span>
                </Button>
              </div>
            </div>
          ) : (
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
       <Button asChild className="group h-16 px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl transition-all active:scale-95 shadow-2xl shadow-primary/20 relative overflow-hidden text-xl uppercase tracking-widest">
        <Link href="/login" className="flex items-center gap-3">
         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
                  <span>Commencer</span>
                </Link>
              </Button>
       <Button asChild variant="outline" className="h-16 px-10 border-2 border-border bg-card text-foreground hover:bg-secondary/10 hover:border-secondary/50 font-black rounded-xl transition-all active:scale-95 backdrop-blur-md text-xl uppercase tracking-widest">
                <Link href="/register">Inscription</Link>
              </Button>
            </div>
          )}
        </div>
      </main>

   <footer className="absolute bottom-10 w-full px-4 flex flex-col items-center gap-4">
    <div className="h-1 w-16 bg-primary rounded-full"></div>
    <p className="text-muted-foreground text-[11px] font-black uppercase tracking-[0.3em] font-display">
          © 2026 Mangathèque • L&apos;univers à portée de main
        </p>
      </footer>
    </div>
  );
}
