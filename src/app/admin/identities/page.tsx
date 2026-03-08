"use client";

import { useEffect, useState } from "react";
import { fetchAllMemberIdentities, approveMember, denyMember, checkRosterMatch } from "../../profile/actions";
import { useSession } from "next-auth/react";
import { Shield, UserPlus, Users, Search, CheckCircle2, XCircle, AlertCircle, Loader2, Sword, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function IdentityAdminPage() {
    const { status } = useSession();
    const [identities, setIdentities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rosterMatches, setRosterMatches] = useState<Record<string, boolean>>({});

    const loadIdentities = async () => {
        setIsLoading(true);
        try {
            const data = await fetchAllMemberIdentities();
            setIdentities(data);

            // Check matches for pending users
            const pending = data.filter((u: any) => u.status === 'Pending');
            const matches: Record<string, boolean> = {};
            for (const user of pending) {
                const mainChar = user.Characters.find((c: any) => c.is_main);
                if (mainChar) {
                    matches[user.id] = await checkRosterMatch(mainChar.name);
                }
            }
            setRosterMatches(matches);
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

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        try {
            await approveMember(id);
            await loadIdentities();
        } catch (e) {
            alert("Approval failed.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleDeny = async (id: string) => {
        if (!confirm("Deny this soul entry and erase from records?")) return;
        setProcessingId(id);
        try {
            await denyMember(id);
            await loadIdentities();
        } catch (e) {
            alert("Denial failed.");
        } finally {
            setProcessingId(null);
        }
    };

    const filteredIdentities = identities.filter(user => {
        const search = searchTerm.toLowerCase();
        const matchesDiscord = user.discord_id.toLowerCase().includes(search);
        const matchesName = (user.display_name || "").toLowerCase().includes(search);
        const matchesChar = user.Characters.some((c: any) => c.name.toLowerCase().includes(search));
        return matchesDiscord || matchesName || matchesChar;
    });

    const pendingUsers = filteredIdentities.filter(u => u.status === 'Pending');
    const activeUsers = filteredIdentities.filter(u => u.status === 'Active');

    if (status === "loading" || isLoading) {
        return <div className="min-h-screen bg-[#0e0c10] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#c5a059] animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-transparent text-gray-300 p-4 sm:p-8 font-sans selection:bg-red-900/50">
            <div className="max-w-7xl mx-auto space-y-10 relative z-10">

                <header className="border-b border-red-900/30 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/"
                            className="p-2.5 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-red-900/30 group"
                            title="Back to Command"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-red-500" />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-[#c5a059] tracking-wider drop-shadow-sm uppercase">
                                High Command <span className="text-white opacity-50">Dashboard</span>
                            </h1>
                            <p className="text-gray-400 mt-2 font-serif italic text-sm">Centralized soul registry. Verify credentials and authorize access to the Dreadkrew domain.</p>
                        </div>
                    </div>
                    <div className="relative w-full md:w-96">
                        <input
                            type="text"
                            placeholder="Search identities..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/60 border border-red-900/40 rounded-xl px-4 py-3 pl-11 text-sm text-gray-200 outline-none focus:border-red-600 shadow-inner group-hover:border-red-900/60 transition-all"
                        />
                        <Search className="absolute left-4 top-3.5 w-4 h-4 text-red-900 opacity-50" />
                    </div>
                </header>

                {/* --- PENDING APPROVALS --- */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-950/40 p-2 rounded-lg border border-red-900/30">
                            <UserPlus className="w-5 h-5 text-red-500" />
                        </div>
                        <h2 className="text-xs font-black uppercase tracking-widest text-red-500">Recruitment Queue ({pendingUsers.length})</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {pendingUsers.map(user => {
                            const mainChar = user.Characters.find((c: any) => c.is_main);
                            const isMatch = rosterMatches[user.id];
                            const isProcessing = processingId === user.id;

                            return (
                                <div key={user.id} className="bg-surface border border-red-900/30 rounded-card p-6 backdrop-blur-[--blur-glass] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-950/20 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>

                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-white tracking-tight">{user.display_name || "Unknown Recruit"}</h3>
                                            <p className="text-[9px] font-black text-blue-500/40 uppercase tracking-widest">Awaiting Verification</p>
                                        </div>
                                        <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${isMatch ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-stone-800 text-stone-500 border-stone-700'}`}>
                                            {isMatch ? 'Verify: High Confidence' : 'Identity Unverified'}
                                        </div>
                                    </div>

                                    <div className="bg-black/40 border border-red-900/20 rounded-lg p-3 mb-6 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-red-950/50 border border-red-900/30 flex items-center justify-center text-sm">
                                                {mainChar ? '⚔️' : '❓'}
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Claimed Main</p>
                                                <p className="text-xs font-bold text-[#c5a059] uppercase">{mainChar?.name || "None Registered"}</p>
                                            </div>
                                        </div>
                                        {isMatch && <CheckCircle2 className="w-5 h-5 text-emerald-500 opacity-50" />}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-red-900/10">
                                        <button
                                            onClick={() => handleDeny(user.id)}
                                            disabled={isProcessing}
                                            className="py-2.5 rounded-lg border border-red-900/40 bg-black/40 hover:bg-red-900/20 text-red-500 text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
                                            Deny Entry
                                        </button>
                                        <button
                                            onClick={() => handleApprove(user.id)}
                                            disabled={isProcessing || !mainChar}
                                            className="py-2.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_4px_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2"
                                        >
                                            {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                            Activate Member
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {pendingUsers.length === 0 && (
                            <div className="col-span-full py-12 border border-dashed border-red-900/20 rounded-2xl flex flex-col items-center justify-center bg-black/10">
                                <AlertCircle className="w-8 h-8 text-stone-700 mb-3" />
                                <p className="text-stone-600 font-serif italic text-sm font-bold uppercase tracking-widest">Queue Clear: No recruitment files pending.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* --- ACTIVE ROSTER --- */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-950/30">
                            <Users className="w-5 h-5 text-emerald-500" />
                        </div>
                        <h2 className="text-xs font-black uppercase tracking-widest text-emerald-500">Authorized Identities ({activeUsers.length})</h2>
                    </div>

                    <div className="bg-[#1a151b]/80 border border-red-900/30 rounded-2xl overflow-hidden backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-black/80 border-b border-red-900/40">
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#c5a059]">Soul Connection</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#c5a059]">Primary Operative</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#c5a059]">Tactical Pulse</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#c5a059]">Security Clearance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-red-900/20">
                                    {activeUsers.map(user => {
                                        const mainChar = user.Characters.find((c: any) => c.is_main);
                                        const alts = user.Characters.filter((c: any) => !c.is_main);

                                        return (
                                            <tr key={user.id} className="hover:bg-red-950/10 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-bold tracking-tight">{user.display_name || "Unknown"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    {mainChar ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(197,160,89,0.1)]">
                                                                ⭐
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-gray-200 font-heading tracking-wide uppercase">{mainChar.name}</span>
                                                                <span className="text-[9px] text-[#c5a059] font-black uppercase tracking-tighter">Verified Main</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-stone-600 italic text-sm">No Main Declared</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex flex-col" title="Last Gank Given">
                                                            <Sword className="w-3 h-3 text-red-500 mb-1 opacity-50" />
                                                            <span className="text-[9px] font-mono font-bold text-stone-500">
                                                                {mainChar?.last_gank_given ? new Date(mainChar.last_gank_given).toLocaleDateString() : '---'}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col" title="Last Online">
                                                            <Shield className="w-3 h-3 text-blue-500 mb-1 opacity-50" />
                                                            <span className="text-[9px] font-mono font-bold text-stone-500">
                                                                {mainChar?.last_online ? new Date(mainChar.last_online).toLocaleDateString() : '---'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`text-[10px] px-2.5 py-1 rounded border ${user.role === 'Admin' ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30' : 'bg-black/40 text-stone-500 border-red-900/20'} font-black uppercase tracking-widest`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
