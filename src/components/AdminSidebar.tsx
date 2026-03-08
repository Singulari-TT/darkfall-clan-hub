"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AdminSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    // Do not show the sidebar on the login page or waiting approval page
    if (pathname === "/login" || pathname === "/waiting-approval") {
        return null;
    }

    // Do not render if the user is not authenticated
    if (!session?.user) {
        return null;
    }

    // @ts-ignore - session.user is extended with role in NextAuth type overrides
    const userRole = session?.user?.role || 'Member';

    // Only Admins get the sidebar
    if (userRole !== 'Admin') {
        return null;
    }

    const adminLinks = [
        { label: "High Command", href: "/admin/identities", icon: "🏢" },
        { label: "Item Scanner", href: "/admin/scanner", icon: "📸" },
        { label: "Vault Statistics", href: "/admin/vault-stats", icon: "📊" },
        { label: "Audit Trail", href: "/admin/audit", icon: "⚙️" },
        { label: "System Vitality", href: "/admin/settings", icon: "⚡" },
        { label: "Donations", href: "/donations", icon: "📜" },
    ];

    return (
        <aside className="fixed z-[4900] left-0 top-[64px] h-[calc(100vh-64px)] w-14 hover:w-48 bg-[#1a151b]/95 backdrop-blur-sm border-r border-red-900/40 transition-all duration-300 overflow-hidden group flex flex-col shadow-[4px_0_15px_rgba(0,0,0,0.5)]">
            <div className="p-3 border-b border-red-900/30">
                <div className="flex items-center text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-[#c5a059] tracking-widest uppercase truncate whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    Admin Tools
                </div>
            </div>

            <div className="flex-1 py-4 flex flex-col gap-2">
                {adminLinks.map((link) => {
                    const isActive = pathname === link.href || pathname?.startsWith(link.href);
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-4 px-4 py-3 mx-1 rounded-md transition-all ${isActive
                                ? 'bg-red-950/60 text-[#c5a059] border border-[#c5a059]/30 shadow-[inset_0_0_10px_rgba(139,0,0,0.2)]'
                                : 'text-gray-400 hover:text-[#c5a059] hover:bg-white/5'
                                }`}
                            title={link.label}
                        >
                            <span className="text-xl flex-shrink-0">{link.icon}</span>
                            <span className="font-heading font-bold text-sm uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                {link.label}
                            </span>
                        </Link>
                    )
                })}
            </div>

            <div className="p-4 border-t border-red-900/30 text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                <span className="text-[10px] uppercase font-bold text-red-900 tracking-widest">Dreadkrew Command</span>
            </div>
        </aside>
    );
}
