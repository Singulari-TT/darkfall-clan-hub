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
        { label: "Command", href: "/", icon: "🏰" },
        { label: "Roster", href: "/directory", icon: "🛡️" },
        { label: "War Room", href: "/map", icon: "🗺️" },
        { label: "Bank Market", href: "/bank-market", icon: "⚖️" },
        { label: "Loot Splitter", href: "/loot-splitter", icon: "🪓" },
        { label: "Media", href: "/media", icon: "📺" },
    ];

    return (
        <nav className="bg-[#0D1117]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-[5000] shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo / Brand */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-8 h-8 rounded bg-gradient-to-br from-[#5865F2] to-[#4752C4] shadow-[0_0_15px_rgba(88,101,242,0.5)] flex items-center justify-center">
                                <span className="text-white font-bold tracking-tighter">DK</span>
                            </div>
                            <span className="text-xl font-heading font-black text-white tracking-widest drop-shadow-sm group-hover:text-blue-400 transition-colors">
                                DREADKREW
                            </span>
                        </Link>
                    </div>

                    {/* Magic Search Bar */}
                    <div className="hidden md:flex flex-1 justify-center px-8">
                        <GlobalSearch />
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-2">
                            {/* Admin links moved to AdminSidebar */}
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${isActive
                                            ? "bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/30 shadow-[inset_0_0_15px_rgba(88,101,242,0.1)]"
                                            : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                                            }`}
                                    >
                                        <span className={`opacity-80 transition-transform ${isActive ? 'scale-110' : ''}`}>{item.icon}</span>
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center gap-5">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-[10px] text-gray-500 font-heading tracking-widest uppercase mb-0.5">Operative</span>
                            <span className="text-sm font-bold text-gray-100">{(session.user as any).displayName || session.user.name}</span>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 px-4 py-2 rounded-lg transition-all shadow-sm"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
