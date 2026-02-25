"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface MangaSearchBarProps {
    onSearch: (query: string) => void;
    isLoading?: boolean;
}

export function MangaSearchBar({ onSearch, isLoading = false }: MangaSearchBarProps) {
    const [query, setQuery] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Rechercher par titre ou ISBN..."
                    className="pl-9"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}

                />
            </div>
            <Button type="submit" disabled={isLoading || !query.trim()}>
                {isLoading ? "Recherche..." : "Rechercher"}
            </Button>
        </form>
    );
}
