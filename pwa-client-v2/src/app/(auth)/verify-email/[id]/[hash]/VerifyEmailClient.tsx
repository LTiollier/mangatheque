'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

import { authService } from '@/services/auth.service';

/**
 * Verify Email Page (Dynamic Route)
 *
 * This page handles /verify-email/[id]/[hash]?expires=...&signature=...
 */
export function VerifyEmailClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Vérification de votre email en cours...');
  
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (verifiedRef.current) return;

    const id = params.id as string;
    const hash = params.hash as string;
    const expires = searchParams.get('expires');
    const signature = searchParams.get('signature');

    const verify = async () => {
      if (!id || !hash || !expires || !signature) {
        setStatus('error');
        setMessage('Lien de vérification invalide ou incomplet.');
        return;
      }

      try {
        await authService.verifyEmail(id, hash, expires, signature);
        verifiedRef.current = true;
        setStatus('success');
        setMessage('Votre email a été vérifié avec succès ! Redirection...');

        setTimeout(() => {
          router.push('/collection?verified=1');
        }, 2000);
      } catch (err) {
        setStatus('error');
        setMessage('Le lien de vérification a expiré ou est invalide.');
      }
    };

    verify();
  }, [params, searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center text-center gap-6 py-12">
      {status === 'loading' && (
        <>
          <Loader2 size={48} className="animate-spin text-primary" />
          <h1 className="text-xl font-bold">{message}</h1>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle2 size={48} className="text-green-500" />
          <h1 className="text-xl font-bold">{message}</h1>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle size={48} className="text-destructive" />
          <h1 className="text-xl font-bold text-destructive">{message}</h1>
          <p className="text-muted-foreground max-w-xs">
            Vous pouvez demander un nouveau lien depuis votre collection.
          </p>
          <Link
            href="/collection"
            className="mt-4 px-6 h-11 flex items-center justify-center rounded-md font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Aller à ma collection
          </Link>
        </>
      )}
    </div>
  );
}
