'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Mail, Loader2, LogOut, Settings, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { getApiErrorMessage } from '@/lib/error';

/**
 * VerifyEmailOverlay — Hard-block UI when email is not verified.
 * 
 * DESIGN:
 * - Glassmorphism card (backdrop-blur-xl)
 * - Premium feel with subtle animations (framer-motion)
 * - Navigation exceptions for /settings
 * - Clear escape routes (Logout, Settings)
 * - Adheres to Atsume Design System (oklch, Syne font)
 */
export function VerifyEmailOverlay() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();

  // EXCEPTION: Allow access to settings to fix email or logout
  const isSettingsPage = pathname?.includes('/settings');
  
  // Show nothing if:
  // - Not authenticated
  // - Already verified
  // - On settings page (to let them change the email)
  if (!isAuthenticated || !user || user.email_verified_at || isSettingsPage) {
    return null;
  }

  const handleResend = () => {
    startTransition(async () => {
      try {
        await authService.sendVerificationEmail();
        toast.success('Lien de vérification envoyé !');
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Erreur lors de l\'envoi du mail'));
      }
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/40 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 300,
            delay: 0.1 
          }}
          className="relative max-w-md w-full"
        >
          {/* Decorative background glow */}
          <div 
            className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] pointer-events-none opacity-20" 
            style={{ background: 'var(--primary)' }}
          />
          
          <div 
            className="relative overflow-hidden border border-white/10 dark:border-white/5 rounded-[24px] p-8 shadow-2xl"
            style={{ 
              background: 'oklch(from var(--card) l c h / 0.8)',
              backdropFilter: 'blur(24px)',
              boxShadow: 'var(--shadow-lg), var(--shadow-glow-sm)'
            }}
          >
            <div className="flex flex-col items-center text-center space-y-6">
              
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center animate-pulse border border-white/10"
                style={{ 
                  background: 'oklch(from var(--primary) l c h / 0.1)',
                  color: 'var(--primary)' 
                }}
              >
                <ShieldAlert size={40} strokeWidth={1.5} />
              </div>

              <div className="space-y-2">
                <h2 
                  className="text-3xl font-bold tracking-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Action requise
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[300px] mx-auto">
                  Votre compte n&apos;est pas encore vérifié. Veuillez confirmer l&apos;email envoyé à <br/>
                  <span className="font-bold text-foreground inline-block mt-1">{user.email}</span>
                </p>
              </div>

              <div className="w-full flex flex-col gap-3 py-2">
                {/* Primary Button */}
                <button 
                  onClick={handleResend}
                  disabled={isPending}
                  className="w-full h-12 flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  style={{ 
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  {isPending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Mail size={18} />
                  )}
                  {isPending ? 'Envoi en cours...' : 'Renvoyer l\'email'}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  {/* Secondary/Settings Button */}
                  <Link 
                    href="/settings"
                    className="h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all hover:bg-white/5 border border-white/5"
                    style={{ 
                      background: 'var(--secondary)',
                      color: 'var(--secondary-foreground)',
                      borderRadius: 'var(--radius)'
                    }}
                  >
                    <Settings size={16} />
                    Réglages
                  </Link>
                  
                  {/* Logout Button */}
                  <button 
                    onClick={() => logout()}
                    className="h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all hover:bg-destructive/10"
                    style={{ 
                      color: 'var(--destructive)',
                      borderRadius: 'var(--radius)'
                    }}
                  >
                    <LogOut size={16} />
                    Quitter
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground opacity-50 px-4">
                Pas de mail ? Vérifiez vos spams ou modifiez l&apos;adresse dans vos réglages.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
