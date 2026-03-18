import type { Metadata, Viewport } from 'next';
import { Syne, Nunito_Sans, IBM_Plex_Mono } from 'next/font/google';

import { ReactQueryProvider } from '@/providers/ReactQueryProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { OfflineProvider } from '@/contexts/OfflineContext';

import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
});

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-nunito-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-ibm-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mangastore',
  description: 'Gérez votre collection de mangas',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Mangastore',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0b',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${syne.variable} ${nunitoSans.variable} ${ibmPlexMono.variable} palette-ember`}
      suppressHydrationWarning
    >
      <body style={{ fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }}>
        <ReactQueryProvider>
          <AuthProvider>
            <OfflineProvider>
              {children}
            </OfflineProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
