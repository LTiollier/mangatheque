"use client";

import { useState } from "react";
import Image from "next/image";
import { Book } from "lucide-react";
import { cn } from "@/lib/utils";

interface MangaCoverProps {
    src: string | null | undefined;
    alt: string;
    fill?: boolean;
    className?: string;
    containerClassName?: string;
    title?: string;
    volumeNumber?: string | number;
    priority?: boolean;
}

export function MangaCover({
    src,
    alt,
    fill = true,
    className,
    containerClassName,
    title,
    volumeNumber,
    priority = false
}: MangaCoverProps) {
    const [error, setError] = useState(false);

    const showPlaceholder = !src || error;

    return (
        <div className={cn("relative w-full h-full overflow-hidden bg-slate-900", containerClassName)}>
            {!showPlaceholder ? (
                <Image
                    src={src!}
                    alt={alt}
                    fill={fill}
                    priority={priority}
                    className={cn("object-cover transition-transform duration-700", className)}
                    onError={() => setError(true)}
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-center relative">
                    {/* Subtle Background Pattern/Icon */}
                    <Book className="absolute h-32 w-32 text-white/5 -rotate-12 pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col items-center gap-2">
                        {volumeNumber && (
                            <span className="font-display font-black text-5xl text-white/20 select-none">
                                T{volumeNumber}
                            </span>
                        )}
                        
                        {title && (
                            <span className="font-display font-black text-sm uppercase tracking-tight text-slate-400 line-clamp-3 px-2">
                                {title}
                            </span>
                        )}
                        
                        {!title && !volumeNumber && (
                            <span className="font-display font-black text-xs uppercase tracking-widest text-slate-500">
                                Image non disponible
                            </span>
                        )}
                    </div>

                    {/* Decorative border */}
                    <div className="absolute inset-2 border border-white/5 rounded-lg pointer-events-none" />
                </div>
            )}
        </div>
    );
}
