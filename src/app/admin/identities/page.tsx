"use client";

import { useEffect, useState } from "react";
import { fetchAllMemberIdentities } from "../../profile/actions";
import { useSession } from "next-auth/react";

export default function IdentityAdminPage() {
    const { status } = useSession();
    const [identities, setIdentities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const loadIdentities = async () => {
        setIsLoading(true);
        try {
            const data = await fetchAllMemberIdentities();
            setIdentities(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            loadIdentities();
        }
    }, [status]);

    const filteredIdentities = identities.filter(user => {
        const search = searchTerm.toLowerCase();
        const matchesDiscord = user.discord_id.toLowerCase().includes(search);
        const matchesName = (user.display_name || "").toLowerCase().includes(search);
        const matchesChar = user.Characters.some((c: any) => c.name.toLowerCase().includes(search));
        return matchesDiscord || matchesName || matchesChar;
    });

    if (status === "loading" || isLoading) {
        return <div className="min-h-screen bg-[#0e0c10] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-red-800 border-t-[#c5a059] animate-spin"></div></div>;
    }

    return (
        <div className="min-h-screen bg-transparent text-gray-300 p-4 sm:p-8 font-sans selection:bg-red-900/50">
            <div className="max-w-7xl mx-auto space-y-8 relative z-10">

                <header className="border-b border-red-900/30 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-[#c5a059] tracking-wider drop-shadow-sm uppercase">
                            Identity Codex
                        </h1>
                        <p className="text-gray-400 mt-2 font-serif italic">Global registry of souls. Map Discord identities to declared operative characters.</p>
                    </div>
                    <div className="relative w-full md:w-96">
                        <input
                            type="text"
                            placeholder="Search by Discord, Name, or Character..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/60 border border-red-900/40 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none focus:border-red-600 shadow-inner"
                        />
                        <span className="absolute right-4 top-3.5 text-red-900 opacity-50">🔍</span>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-[#1a151b]/80 border border-red-900/30 rounded-2xl overflow-hidden backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/80 border-b border-red-900/40">
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#c5a059]">Discord Connection</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#c5a059]">Main Character</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#c5a059]">Roster Detail</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#c5a059]">Rank</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-red-900/20">
                                {filteredIdentities.map(user => {
                                    const mainChar = user.Characters.find((c: any) => c.is_main);
                                    const alts = user.Characters.filter((c: any) => !c.is_main);

                                    return (
                                        <tr key={user.id} className="hover:bg-red-950/10 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold tracking-tight">{user.display_name || "Unknown"}</span>
                                                    <span className="text-[10px] font-mono text-stone-600 mt-1">{user.discord_id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                {mainChar ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(197,160,89,0.1)]">
                                                            ⭐
                                                        </div>
                                                        <span className="font-bold text-[#c5a059] font-heading tracking-wide uppercase">{mainChar.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-stone-600 italic text-sm">No Main Declared</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-wrap gap-2 max-w-md">
                                                    {alts.length === 0 && !mainChar ? (
                                                        <span className="text-stone-700 text-xs italic">Unregistered Roster</span>
                                                    ) : (
                                                        alts.map((alt: any) => (
                                                            <span key={alt.id} className={`text-[10px] px-2 py-1 rounded border border-red-900/30 bg-black/40 text-stone-400 font-bold uppercase tracking-tighter ${alt.admin_only ? 'text-red-400/70 border-red-900/50' : ''}`} title={alt.admin_only ? "Classified Alt" : "Alt"}>
                                                                {alt.name}
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`text-[10px] px-2.5 py-1 rounded-full border ${user.role === 'Admin' ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30' : 'bg-black/40 text-stone-500 border-red-900/20'} font-black uppercase tracking-widest`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredIdentities.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-stone-600 italic font-serif">
                                            No souls matching your query found in the codex.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
