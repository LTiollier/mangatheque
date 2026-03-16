"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Book, Library, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
    { icon: Home, label: "Accueil", href: "/dashboard" },
    { icon: Search, label: "Recherche", href: "/search" },
    { icon: Plus, label: "Scanner", href: "/scan" },
    { icon: Book, label: "Collection", href: "/collection" },
    { icon: Settings, label: "Profil", href: "/settings" },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/80 backdrop-blur-xl border-t border-border/50 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-around h-20 px-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    if (item.href === "/scan") {
                         return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative -top-6 flex flex-col items-center justify-center p-2"
                            >
                                <motion.div 
                                    whileTap={{ scale: 0.9 }}
                                    className="h-14 w-14 bg-primary rounded-full shadow-[0_8px_20px_rgba(255,87,34,0.4)] border-4 border-background flex items-center justify-center text-white"
                                >
                                    <Plus className="h-7 w-7" />
                                </motion.div>
                                <span className="mt-8 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Scanner</span>
                            </Link>
                         );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full transition-colors relative h-[70px]",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            <div className="relative">
                                {isActive && (
                                    <motion.div 
                                        layoutId="activeTabMobile"
                                        className="absolute -inset-2 bg-primary/10 rounded-xl -z-10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <Icon className={cn("h-5 w-5 relative transition-transform", isActive && "scale-110")} />
                            </div>
                            <span className={cn(
                                "mt-1.5 text-[9px] font-black uppercase tracking-widest transition-all",
                                isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
