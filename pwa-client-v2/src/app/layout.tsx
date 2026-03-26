import type { Metadata, Viewport } from 'next';
import { Syne, Nunito_Sans, IBM_Plex_Mono } from 'next/font/google';

import { Toaster } from 'sonner';
import { ReactQueryProvider } from '@/providers/ReactQueryProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { OfflineProvider } from '@/contexts/OfflineContext';
import { PaletteProvider } from '@/contexts/PaletteContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

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
  title: 'Atsume',
  description: 'Gérez votre collection de mangas',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Atsume',
    startupImage: [
      // iPhone 16 Pro Max (440×956 @3x)
      { url: '/splash/splash-1320x2868.png', media: '(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      // iPhone 16 Pro (402×874 @3x)
      { url: '/splash/splash-1206x2622.png', media: '(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      // iPhone 16 Plus / 15 Pro Max / 15 Plus (430×932 @3x)
      { url: '/splash/splash-1290x2796.png', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      // iPhone 16 / 15 Pro / 15 (393×852 @3x)
      { url: '/splash/splash-1179x2556.png', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      // iPhone 14 Plus / 14 Pro Max (428×926 @3x)
      { url: '/splash/splash-1284x2778.png', media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      // iPhone 14 / 13 Pro / 13 (390×844 @3x)
      { url: '/splash/splash-1170x2532.png', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      // iPhone SE 3rd gen (375×667 @2x)
      { url: '/splash/splash-750x1334.png', media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      // iPad Pro 12.9in (1024x1366 @2x)
      { url: '/splash/splash-2048x2732.png', media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      // iPad Pro 11in (834x1194 @2x)
      { url: '/splash/splash-1668x2388.png', media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      // iPad Air 5th gen (820×1180 @2x)
      { url: '/splash/splash-1640x2360.png', media: '(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      // iPad mini 6th gen (744×1133 @2x)
      { url: '/splash/splash-1488x2266.png', media: '(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
    ],
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
      className={`${syne.variable} ${nunitoSans.variable} ${ibmPlexMono.variable} theme-void palette-oni`}
      suppressHydrationWarning
    >
      <body style={{ fontFamily: 'var(--font-body)', background: 'var(--background)', color: 'var(--foreground)' }}>
        {/* Inline blocking script — runs before first paint to apply saved theme/palette.
            Prevents flash of default theme-void/palette-oni when user has a different preference.
            suppressHydrationWarning on <html> absorbs the class mismatch. (rendering-hydration-no-flicker) */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var themes=['void','light'],palettes=['oni','kitsune','kaminari','matcha','sakura','katana','mangaka'],h=document.documentElement,t=localStorage.getItem('atsume-theme:v1'),p=localStorage.getItem('atsume-palette:v1');if(t&&themes.includes(t)){themes.forEach(function(x){h.classList.remove('theme-'+x)});h.classList.add('theme-'+t)}if(p&&palettes.includes(p)){palettes.forEach(function(x){h.classList.remove('palette-'+x)});h.classList.add('palette-'+p)}}catch(e){}})();` }} />
        <ReactQueryProvider>
          <ThemeProvider>
          <PaletteProvider>
            <AuthProvider>
              <OfflineProvider>
                {children}
                <Toaster position="top-center" richColors />
              </OfflineProvider>
            </AuthProvider>
          </PaletteProvider>
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
