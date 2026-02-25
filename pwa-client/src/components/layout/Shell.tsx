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
    Menu,
    X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ShellProps {
    children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <LucideBook className="h-5 w-5 text-purple-400" />
                    </div>
                    <span className="font-black uppercase tracking-tight text-sm">Mangathèque</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
            </div>

            {/* Sidebar / Desktop Navigation */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 hidden md:flex flex-col",
                isMobileMenuOpen ? "translate-x-0 flex" : "-translate-x-full md:flex"
            )}>
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
                            <LucideBook className="h-6 w-6 text-purple-400" />
                        </div>
                        <span className="text-xl font-black tracking-tight uppercase text-white">Mangathèque</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                                )}
                            >
                                <item.icon className={cn(
                                    "h-5 w-5 transition-colors",
                                    isActive ? "text-purple-400" : "text-slate-500 group-hover:text-slate-300"
                                )} />
                                <span className="font-bold text-sm">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800 mt-auto">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                            <LucideUser className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold truncate text-white">{user?.name}</span>
                            <span className="text-[10px] text-slate-500 truncate uppercase tracking-widest">{user?.email}</span>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-bold text-xs"
                        onClick={logout}
                    >
                        <LucideLogOut className="mr-3 h-4 w-4" />
                        Déconnexion
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto md:p-8 p-4 bg-slate-950 custom-scrollbar">
                {children}
            </main>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}
