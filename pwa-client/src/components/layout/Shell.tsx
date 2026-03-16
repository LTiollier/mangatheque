"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard as LucideLayoutDashboard,
    LogOut as LucideLogOut,
    Search as LucideSearch,
    Book as LucideBook,
    Heart as LucideHeart,
    Settings as LucideSettings,
    User as LucideUser,
    ScanBarcode as LucideScanBarcode,
    ArrowLeftRight as LucideArrowLeftRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BottomNav } from "./BottomNav";

interface ShellProps {
    children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const navigation = [
        { name: "Tableau de bord", href: "/dashboard", icon: LucideLayoutDashboard },
        { name: "Scanner à la chaîne", href: "/scan", icon: LucideScanBarcode },
        { name: "Recherche", href: "/search", icon: LucideSearch },
        { name: "Ma Collection", href: "/collection", icon: LucideBook },
        { name: "Prêts", href: "/loans", icon: LucideArrowLeftRight },
        { name: "Wishlist", href: "/wishlist", icon: LucideHeart },
        { name: "Paramètres", href: "/settings", icon: LucideSettings },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row relative">
            {/* Sidebar / Desktop Navigation */}
            <aside className="hidden md:flex flex-col w-72 bg-card border-r border-border h-screen sticky top-0 shrink-0">
                <div className="p-8 border-b border-border">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-lg shadow-primary/10">
                            <LucideBook className="h-7 w-7 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black tracking-tight uppercase text-foreground font-display leading-tight">Manga</span>
                            <span className="text-xl font-black tracking-tight uppercase text-primary font-display leading-tight">thèque</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                    isActive
                                        ? "bg-primary/10 text-primary border border-primary/20 shadow-md shadow-primary/5"
                                        : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                                )}
                            >
                                <item.icon className={cn(
                                    "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                                    isActive ? "text-primary" : "text-slate-500 group-hover:text-primary/70"
                                )} />
                                <span className="font-bold text-sm tracking-wide uppercase font-display">{item.name}</span>
                                {isActive && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-l-full shadow-lg shadow-primary/50" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-border bg-card/50 mt-auto">
                    <div className="flex items-center gap-4 px-4 py-3 mb-4 rounded-xl bg-background border border-border">
                        <div className="h-10 w-10 rounded-full bg-card flex items-center justify-center border border-border shadow-inner">
                            <LucideUser className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-black truncate text-foreground">{user?.name}</span>
                            <span className="text-[10px] text-muted-foreground truncate uppercase tracking-widest font-black leading-none">{user?.email}</span>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive hover:text-white hover:bg-destructive rounded-xl transition-all duration-300 font-black text-xs uppercase tracking-widest px-6"
                        onClick={logout}
                    >
                        <LucideLogOut className="mr-3 h-4 w-4" />
                        Quitter
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto md:p-10 p-4 pb-24 md:pb-10 bg-background custom-scrollbar">
                {children}
            </main>

            {/* Mobile Navigation */}
            <BottomNav />
        </div>
    );
}
