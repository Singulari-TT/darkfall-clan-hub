"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import GlobalSearch from "./GlobalSearch";

export default function Navbar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    // Do not show the navigation bar on the login page or waiting approval page
    if (pathname === "/login" || pathname === "/waiting-approval") {
        return null;
    }

    // Do not render the navbar if the user is not authenticated yet.
    if (!session?.user) {
        return null;
    }

    // @ts-ignore - session.user is extended with role in NextAuth type overrides but TS may not know it here
    const userRole = session?.user?.role || 'Member';

    const navItems = [
        { label: "Command", href: "/", icon: "📡" },
        { label: "Tavern", href: "/tavern", icon: "🍺" },
        { label: "War Room", href: "/map", icon: "🛰️" },
        { label: "Empire", href: "/empire", icon: "🏰" },
    ];

    const toolItems = [
        { label: "Tournaments", href: "/tournaments", icon: "⚔️" },
        { label: "Loot Splitter", href: "/loot-splitter", icon: "🪓" },
        { label: "Bank Market", href: "/bank-market", icon: "⚖️" },
        { label: "Media", href: "/media", icon: "📺" },
        ...(userRole === 'Admin' ? [{ label: "High Command", href: "/admin/settings", icon: "⚙️" }] : []),
    ];

    const isToolActive = toolItems.some(t => pathname === t.href);

    return (
        <nav className="bg-[#0D1117]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-[5000] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-8 h-8 rounded bg-gradient-to-br from-[#5865F2] to-[#4752C4] shadow-[0_0_15px_rgba(88,101,242,0.5)] flex items-center justify-center">
                                <span className="text-white font-bold tracking-tighter">DK</span>
                            </div>
                            <span className="text-xl font-heading font-black text-white tracking-widest drop-shadow-sm group-hover:text-[#5865F2] transition-colors">
                                DREADKREW
                            </span>
                        </Link>
                    </div>

                    {/* Search */}
                    <div className="hidden md:flex flex-1 justify-center px-8">
                        <GlobalSearch />
                    </div>

                    {/* Nav links + Tools dropdown */}
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all border ${isActive
                                        ? "bg-[#5865F2]/10 text-[#5865F2] border-[#5865F2]/30 shadow-[inset_0_0_15px_rgba(88,101,242,0.1)]"
                                        : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent"
                                        }`}
                                >
                                    <span className={`transition-transform ${isActive ? "scale-110" : ""}`}>{item.icon}</span>
                                    {item.label}
                                </Link>
                            );
                        })}

                        {/* Tools dropdown — 5th slot */}
                        <div className="relative group">
                            <button
                                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all border ${isToolActive
                                    ? "bg-[#5865F2]/10 text-[#5865F2] border-[#5865F2]/30 shadow-[inset_0_0_15px_rgba(88,101,242,0.1)]"
                                    : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent"
                                    }`}
                            >
                                <span>🔧</span>
                                Tools
                                <svg
                                    className="w-3 h-3 opacity-40 group-hover:opacity-100 group-hover:rotate-180 transition-all duration-200"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown */}
                            <div className="absolute right-0 top-full pt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 translate-y-1 group-hover:translate-y-0">
                                <div className="bg-[#0D1117]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.7)] overflow-hidden p-1 w-48">
                                    {toolItems.map((item) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                                    ? "bg-[#5865F2]/15 text-[#5865F2]"
                                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                                    }`}
                                            >
                                                <span className="text-base">{item.icon}</span>
                                                {item.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User info + sign out */}
                    <div className="flex items-center gap-4 ml-4">
                        <span className="hidden md:block text-sm font-bold text-gray-300">
                            {(session.user as any).displayName || session.user.name}
                        </span>
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="text-xs font-bold text-gray-500 hover:text-white bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 px-3 py-2 rounded-lg transition-all"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
