"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import Fuse from "fuse.js";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface SearchItem {
    id: string;
    title: string;
    type: string;
    href: string;
    subtitle: string;
}

export default function GlobalSearch() {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [items, setItems] = useState<SearchItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const pathname = usePathname();

    // Close search when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close search on route change
    useEffect(() => {
        setIsOpen(false);
        setQuery("");
    }, [pathname]);

    useEffect(() => {
        async function fetchSearchData() {
            if (query.trim().length < 2) {
                setItems([]);
                return;
            }

            setIsLoading(true);
            try {
                const res = await fetch('/api/database/search');
                if (res.ok) {
                    const allData: SearchItem[] = await res.json();
                    // Initialize fuse for fuzzy search
                    const fuse = new Fuse(allData, {
                        keys: ['title', 'subtitle'],
                        threshold: 0.4, // Allows for typos like 'orchan' vs 'ochran'
                        distance: 100,
                        ignoreLocation: true // Search can match anywhere in the string
                    });
                    const results = fuse.search(query);
                    const filtered = results.map(r => r.item);
                    setItems(filtered.slice(0, 10)); // Max 10 results
                }
            } catch (err) {
                console.error("Search failed:", err);
            } finally {
                setIsLoading(false);
            }
        }

        const timeoutId = setTimeout(() => {
            fetchSearchData();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <div className="relative" ref={searchRef}>
            <div className="flex items-center bg-black/40 border border-red-900/50 rounded-full px-3 py-1.5 focus-within:border-amber-500/50 focus-within:bg-black/60 transition-all w-full max-w-sm">
                <Search className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                <input
                    type="text"
                    placeholder="Search monster, recipe, or area..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => {
                        if (query.length >= 2) setIsOpen(true);
                    }}
                    className="bg-transparent text-sm text-gray-200 placeholder-gray-500 focus:outline-none w-full"
                />
                {isLoading && <Loader2 className="w-4 h-4 text-amber-500 animate-spin flex-shrink-0 ml-2" />}
            </div>

            {/* Dropdown Results */}
            {isOpen && query.length >= 2 && (
                <div className="absolute top-12 left-0 right-0 bg-[#0e0c10] border border-red-900/50 rounded-lg shadow-2xl z-50 overflow-hidden">
                    {items.length === 0 && !isLoading ? (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center italic">
                            No archives matched "{query}"
                        </div>
                    ) : (
                        <ul className="max-h-96 overflow-y-auto divide-y divide-white/5">
                            {items.map((item) => (
                                <li key={item.id}>
                                    <Link
                                        href={item.href}
                                        className="block px-4 py-3 hover:bg-white/5 transition-colors group"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-gray-200 group-hover:text-amber-500 transition-colors text-sm">
                                                {item.title}
                                            </span>
                                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/50 text-gray-400">
                                                {item.type}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                            {item.subtitle}
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="bg-black/40 px-4 py-2 border-t border-white/5 text-[10px] text-gray-600 uppercase tracking-widest text-center">
                        Press Esc to close
                    </div>
                </div>
            )}
        </div>
    );
}
