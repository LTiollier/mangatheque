"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { HeartCrack, BookOpen, Package, X, Loader2 } from "lucide-react";
import { useWishlist, useRemoveFromWishlist } from "@/hooks/queries";
import { WishlistItem } from "@/types/manga";
import { Button } from "@/components/ui/button";

function WishlistCard({ item, onRemove, isRemoving }: { item: WishlistItem; onRemove: () => void; isRemoving: boolean }) {
    const router = useRouter();

    function getHref(): string {
        if (item.type === 'edition') {
            return `/search/series/${item.series_id}/edition/${item.id}`;
        }
        return `/search/series/${item.series_id}/box-set/${item.box_set_id}`;
    }

    function handleClick(e: React.MouseEvent) {
        if ((e.target as HTMLElement).closest('button')) return;
        router.push(getHref());
    }
    const title = item.type === 'edition'
        ? item.series?.title ?? item.name
        : item.title;

    const subtitle = item.type === 'edition'
        ? item.name
        : (item.box_set?.series?.title ?? null);

    const coverUrl = item.type === 'edition'
        ? (item.cover_url ?? null)
        : item.cover_url;

    return (
        <div onClick={handleClick} className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors cursor-pointer">
            <div className="aspect-[2/3] relative bg-slate-800">
                {coverUrl ? (
                    <Image src={coverUrl} alt={title} fill className="object-cover" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        {item.type === 'edition' ? (
                            <BookOpen className="h-10 w-10 text-slate-600" />
                        ) : (
                            <Package className="h-10 w-10 text-slate-600" />
                        )}
                    </div>
                )}
                <div className="absolute top-2 left-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.type === 'edition' ? 'bg-primary/80 text-white' : 'bg-amber-500/80 text-white'}`}>
                        {item.type === 'edition' ? 'Édition' : 'Coffret'}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRemove}
                    disabled={isRemoving}
                    className="absolute top-2 right-2 h-8 w-8 bg-slate-900/80 hover:bg-red-500/80 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                >
                    {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                </Button>
            </div>
            <div className="p-3 space-y-1">
                <p className="font-bold text-sm leading-tight truncate">{title}</p>
                {subtitle && (
                    <p className="text-xs text-slate-400 truncate">{subtitle}</p>
                )}
                {item.type === 'edition' && item.total_volumes && (
                    <p className="text-xs text-slate-500">{item.total_volumes} tome{item.total_volumes > 1 ? 's' : ''}</p>
                )}
            </div>
        </div>
    );
}

export default function WishlistPage() {
    const { data: wishlist = [], isLoading, error } = useWishlist();
    const removeFromWishlist = useRemoveFromWishlist();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                        <HeartCrack className="h-3 w-3" />
                        Envies
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Ma Liste de Souhaits
                    </h1>
                    <p className="text-slate-400 font-medium">
                        Retrouvez ici les éditions et coffrets que vous souhaitez acquérir.
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="aspect-[2/3] animate-pulse bg-slate-900 rounded-2xl border border-slate-800" />
                    ))}
                </div>
            ) : error ? (
                <div className="bg-red-500/10 text-red-400 p-6 rounded-2xl flex items-center justify-center gap-2 border border-red-500/20">
                    <p className="font-bold">Impossible de charger la liste de souhaits.</p>
                </div>
            ) : wishlist.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {wishlist.map((item) => (
                        <WishlistCard
                            key={`${item.type}-${item.id}`}
                            item={item}
                            onRemove={() => removeFromWishlist.mutate({ id: item.id, type: item.type })}
                            isRemoving={removeFromWishlist.isPending}
                        />
                    ))}
                </div>
            ) : (
                <div className="p-20 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl">
                    <div className="bg-slate-900/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800">
                        <HeartCrack className="h-10 w-10 text-slate-700" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Votre liste de souhaits est vide</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        Recherchez des mangas pour ajouter des éditions ou coffrets ici.
                    </p>
                </div>
            )}
        </div>
    );
}
