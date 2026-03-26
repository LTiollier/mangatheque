'use client';

import { Download } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export function InstallAppCard() {
  const { isInstallable, isInstalled, prompt } = useInstallPrompt();

  if (!isInstallable || isInstalled) return null;

  return (
    <div
      className="rounded-[calc(var(--radius)*2)] overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Download size={16} aria-hidden style={{ color: 'var(--primary)', marginTop: 2, flexShrink: 0 }} />
          <div className="min-w-0">
            <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--foreground)' }}>
              Installer Atsume
            </p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Accédez à votre collection depuis l&apos;écran d&apos;accueil, sans navigateur.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={prompt}
          className="shrink-0 h-9 px-4 text-sm font-semibold flex items-center gap-2 transition-opacity hover:opacity-90"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            borderRadius: 'var(--radius)',
          }}
        >
          Installer
        </button>
      </div>
    </div>
  );
}
