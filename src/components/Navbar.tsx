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
        <nav className="bg-background/80 backdrop-blur-[--blur-glass] border-b border-surface-border sticky top-0 z-[5000] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            <div className="w-full px-6 lg:px-10">
                <div className="flex items-center justify-between h-20">

                    {/* Left: Logo */}
                    <div className="flex-1 flex justify-start">
                        <Link href="/" className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded bg-gradient-to-br from-social-cobalt to-[#4752C4] shadow-[0_0_20px_rgba(88,101,242,0.4)] flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3">
                                <span className="text-white font-bold tracking-tighter text-lg">DK</span>
                            </div>
                            <span className="text-2xl font-heading font-black text-white tracking-[0.2em] drop-shadow-sm group-hover:text-social-cobalt transition-colors hidden sm:block">
                                DREADKREW
                            </span>
                        </Link>
                    </div>

                    {/* Center: Nav links + Tools dropdown */}
                    <div className="flex-none hidden md:flex items-center gap-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all border ${isActive
                                        ? "bg-social-cobalt-dim text-social-cobalt border-social-cobalt-border shadow-[inset_0_0_20px_rgba(88,101,242,0.1)]"
                                        : "text-gray-400 hover:text-white hover:bg-surface-hover border-transparent"
                                        }`}
                                >
                                    <span className={`transition-transform duration-300 ${isActive ? "scale-125" : "group-hover:scale-110"}`}>{item.icon}</span>
                                    {item.label}
                                </Link>
                            );
                        })}

                        {/* Tools dropdown */}
                        <div className="relative group">
                            <button
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all border ${isToolActive
                                    ? "bg-social-cobalt-dim text-social-cobalt border-social-cobalt-border shadow-[inset_0_0_20px_rgba(88,101,242,0.1)]"
                                    : "text-gray-400 hover:text-white hover:bg-surface-hover border-transparent"
                                    }`}
                            >
                                <span>🔧</span>
                                Tools
                                <svg
                                    className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:rotate-180 transition-all duration-300"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown */}
                            <div className="absolute right-0 top-full pt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 translate-y-2 group-hover:translate-y-0">
                                <div className="bg-background/95 backdrop-blur-2xl border border-surface-border rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden p-1.5 w-56">
                                    {toolItems.map((item) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                                    ? "bg-social-cobalt-dim text-social-cobalt"
                                                    : "text-gray-400 hover:text-white hover:bg-surface-hover"
                                                    }`}
                                            >
                                                <span className="text-lg">{item.icon}</span>
                                                {item.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Search + User info */}
                    <div className="flex-1 flex justify-end items-center gap-8">
                        {/* Search Container */}
                        <div className="hidden md:block w-72 lg:w-96">
                            <GlobalSearch />
                        </div>

                        {/* User info + sign out */}
                        <div className="flex items-center gap-5 border-l border-surface-border pl-8">
                            <div className="flex items-center gap-3">
                                {session.user.image && (
                                    <img
                                        src={session.user.image}
                                        alt="Avatar"
                                        className="w-9 h-9 rounded-full border border-red-900/40 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                                    />
                                )}
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c5a059] opacity-70">Operative</span>
                                    <span className="text-sm font-bold text-gray-100 leading-tight">
                                        {(session.user as any).displayName || session.user.name}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white bg-surface hover:bg-red-500/10 border border-surface-border hover:border-red-500/40 px-4 py-2.5 rounded-lg transition-all shadow-sm"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
