import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect("/login");
    }

    // @ts-ignore - session.user is extended with role
    const userRole = session.user.role;

    if (userRole !== "Admin") {
        redirect("/");
    }

    const tabs = [
        { href: "/admin/scanner", label: "Item Scanner" },
        { href: "/admin/audit", label: "Audit Logs" },
        { href: "/admin/identities", label: "Identities" },
        { href: "/admin/vault-stats", label: "Vault Stats" },
        { href: "/admin/data-sync", label: "Data Sync" },
        { href: "/admin/settings", label: "System Config" },
    ];

    return (
        <div className="flex flex-col space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-gray-300">
            <div className="border-b border-red-900/50 pb-4">
                <h1 className="text-3xl font-heading font-black bg-gradient-to-r from-red-600 to-[#c5a059] bg-clip-text text-transparent uppercase tracking-wider drop-shadow-md">
                    Dreadkrew High Command
                </h1>
                <p className="text-stone-400 mt-1 font-serif italic text-sm">
                    Restricted Access. Centralized management, logistics configurations, and monitoring.
                </p>

                <div className="flex flex-wrap gap-3 mt-6">
                    {tabs.map(tab => (
                        <a
                            key={tab.href}
                            href={tab.href}
                            className="px-4 py-2 bg-[#1a151b] border border-red-900/50 hover:border-red-500 rounded text-xs font-bold font-heading uppercase tracking-widest text-[#c5a059] transition-all shadow-[inset_0_0_10px_rgba(139,0,0,0.2)]"
                        >
                            {tab.label}
                        </a>
                    ))}
                </div>
            </div>

            <div className="bg-[#1a151b]/80 rounded-xl border border-red-900/30 p-6 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                {children}
            </div>
        </div>
    );
}
