"use client"; import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Book, ScanBarcode, Search, Settings } from "lucide-react";
import { cn } from "@/lib/utils"; const navigation = [ { name: "Accueil", href: "/dashboard", icon: LayoutDashboard }, { name: "Collection", href: "/collection", icon: Book }, { name: "Scan", href: "/scan", icon: ScanBarcode, isFab: true }, { name: "Recherche", href: "/search", icon: Search }, { name: "Paramètres", href: "/settings", icon: Settings },
]; export function BottomNav() { const pathname = usePathname(); return ( <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border pb-safe md:hidden">
                <nav className="flex justify-around items-center h-16 relative">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        if (item.href === "/scan") {
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="relative -top-6 flex flex-col items-center group"
                                >
                                    <div className={cn(
                                        "h-16 w-16 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/40 border-4 border-background transition-transform duration-300 group-hover:scale-110 group-active:scale-95",
                                        isActive && "ring-4 ring-primary/20"
                                    )}>
                                        <item.icon className="h-7 w-7 text-primary-foreground" />
                                    </div>
                                    <span className={cn(
                                        "absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-widest text-primary transition-opacity duration-300",
                                        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                    )}>
                                        {item.name}
                                    </span>
                                </Link>
                            );
                        }

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative",
                                    isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
                                )}
                            >
                                <item.icon className={cn(
                                    "h-5 w-5 mb-1 transition-transform duration-300",
                                    isActive ? "scale-110" : "group-hover:scale-110"
                                )} />
                                <span className="text-[9px] font-black uppercase tracking-widest">{item.name}</span>
                                {isActive && (
                                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
 </nav> );
}
