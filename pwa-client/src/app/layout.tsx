import type { Metadata } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AlertProvider } from "@/contexts/AlertContext";
import { OfflineProvider } from "@/contexts/OfflineContext";
import { Toaster } from "sonner";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
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
    className={`${inter.variable} ${bebasNeue.variable} text-sm antialiased text-foreground bg-background`}
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
