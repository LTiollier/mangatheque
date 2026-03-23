import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { VerifyEmailClient } from './VerifyEmailClient';

export default function VerifyEmailPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex flex-col items-center justify-center gap-6 py-12">
          <Loader2 size={48} className="animate-spin text-primary" />
          <h1 className="text-xl font-bold">Vérification de votre email...</h1>
        </div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}
