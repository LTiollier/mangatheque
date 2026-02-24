import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AlertProvider } from "@/contexts/AlertContext";
import { OfflineProvider } from "@/contexts/OfflineContext";
import { Toaster } from "sonner";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mangathèque",
  description: "Suivez votre collection de mangas",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mangathèque",
  },
};

export const viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} text-sm antialiased`}
      >
        <ReactQueryProvider>
          <AuthProvider>
            <OfflineProvider>
              <AlertProvider>
                {children}
                <Toaster richColors position="top-center" theme="dark" />
              </AlertProvider>
            </OfflineProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
