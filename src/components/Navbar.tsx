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
    ];

    return (
        <nav className="bg-[#0e0c10] border-b border-red-900/30 sticky top-0 z-[5000] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo / Brand */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center gap-2">
                            <span className="text-xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-red-700 to-amber-500 tracking-wider drop-shadow-sm">
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
                        <div className="ml-10 flex items-baseline space-x-1">
                            {/* Admin Context (Requires Check) */}
                            {userRole === 'Admin' && (
                                <>
                                    <Link
                                        href="/admin/audit"
                                        className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${pathname?.startsWith('/admin')
                                            ? "bg-red-950/60 text-amber-500 border border-red-900/50 shadow-inner"
                                            : "text-gray-400 hover:text-amber-400 hover:bg-white/5"
                                            }`}
                                    >
                                        <span>⚙️</span>
                                        Admin
                                    </Link>
                                    <Link
                                        href="/donations"
                                        className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${pathname === '/donations'
                                            ? "bg-red-950/60 text-[#c5a059] border border-[#c5a059]/50 shadow-[0_0_10px_rgba(197,160,89,0.2)]"
                                            : "text-gray-400 hover:text-[#c5a059] hover:bg-white/5"
                                            }`}
                                    >
                                        <span>📜</span>
                                        Donations
                                    </Link>
                                </>
                            )}
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${isActive
                                            ? "bg-red-950/40 text-[#c5a059] border border-red-900/30 shadow-[inset_0_0_10px_rgba(139,0,0,0.2)]"
                                            : "text-gray-400 hover:text-[#c5a059] hover:bg-white/5"
                                            }`}
                                    >
                                        <span className="opacity-80">{item.icon}</span>
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-xs text-gray-500 font-heading tracking-widest uppercase">Krew Member</span>
                            <span className="text-sm font-bold text-gray-200">{session.user.name}</span>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="text-xs font-bold text-red-500 hover:text-white bg-red-900/20 hover:bg-red-800 border border-red-900/50 px-4 py-1.5 rounded uppercase tracking-wider transition-all"
                        >
                            Disconnect
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
