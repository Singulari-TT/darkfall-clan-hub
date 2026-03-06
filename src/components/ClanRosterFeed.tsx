"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Users, Sword, Shield, RefreshCw, ChevronRight, Clock, User } from "lucide-react";

interface ClanRoster {
    clan_name: string;
    member_count: number;
    top_member: string;
    top_member_activity: number;
    total_activity: number;
    last_scanned: string;
}

export default function ClanRosterFeed() {
    const { data: session } = useSession();
    const router = useRouter();
    const [clans, setClans] = useState<ClanRoster[]>([]);
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isAdmin = (session?.user as any)?.role === 'Admin';

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/roster/clans");
            const data = await res.json();
            if (data.success) {
                setClans(data.clans);
                setLastScanned(data.lastScanned);
            } else {
                setError(data.error || "Failed to load rosters");
            }
        } catch (err) {
            setError("Network error loading rosters");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        try {
            const res = await fetch("/api/roster/refresh", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                await fetchData();
            } else {
                alert(data.error || "Refresh failed");
            }
        } catch (err) {
            console.error(err);
            alert("Refresh failed due to network error");
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (isLoading && clans.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 gap-4 h-full">
                <Loader2 className="w-8 h-8 text-[#5865F2] animate-spin" />
                <p className="text-[#5865F2] font-mono text-xs tracking-widest uppercase animate-pulse">Accessing Archive Data...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#0a0f18]">
            {/* Header / Actions */}
            <div className="p-6 border-b border-white/5 bg-black/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Shield className="w-5 h-5 text-[#5865F2]" />
                        <h3 className="text-lg font-black text-white tracking-widest uppercase">Global Roster Intelligence</h3>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                        <Clock className="w-3 h-3 text-gray-600" />
                        Last Network Scan: {lastScanned ? new Date(lastScanned).toLocaleString() : "NEVER"}
                    </div>
                </div>

                {isAdmin && (
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg border font-black uppercase tracking-widest text-xs transition-all
                            ${isRefreshing
                                ? "bg-white/5 border-white/10 text-gray-500 cursor-not-allowed"
                                : "bg-[#5865F2]/20 border-[#5865F2]/40 text-[#5865F2] hover:bg-[#5865F2]/30 hover:shadow-[0_0_15px_rgba(88,101,242,0.2)]"
                            }`}
                    >
                        {isRefreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        {isRefreshing ? "Scanning Feed..." : "Refresh Intelligence"}
                    </button>
                )}
            </div>

            {/* Grid Area */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {clans.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <Users className="w-12 h-12 text-gray-800 mb-4" />
                        <h4 className="text-gray-500 font-bold uppercase tracking-widest">No Intelligence Data Cached</h4>
                        <p className="text-gray-600 text-xs mt-2 font-sans italic max-w-xs">
                            {isAdmin
                                ? "Initiate a global network scan to deduce the current power structure of Agon."
                                : "High Command has not yet released the latest roster intelligence."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
                        {clans.map((clan) => (
                            <button
                                key={clan.clan_name}
                                onClick={() => router.push(`/roster/${encodeURIComponent(clan.clan_name)}`)}
                                className="group bg-white/5 border border-white/10 rounded-2xl p-5 text-left transition-all hover:bg-white/10 hover:border-[#5865F2]/50 hover:-translate-y-1 relative overflow-hidden"
                            >
                                {/* Decorative detail */}
                                <div className="absolute top-0 right-0 w-24 h-24 bg-[#5865F2]/5 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:bg-[#5865F2]/10"></div>

                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center group-hover:border-[#5865F2]/30 transition-colors">
                                        <Users className="w-6 h-6 text-gray-400 group-hover:text-[#5865F2] transition-colors" />
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <Sword className="w-3.5 h-3.5 text-rose-500" />
                                            <span className="text-lg font-black text-white">{clan.total_activity}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-tighter">Total Combat Entries</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-xl font-black text-white group-hover:text-[#5865F2] transition-colors tracking-tight truncate">
                                            {clan.clan_name}
                                        </h4>
                                        <p className="text-xs text-emerald-500/80 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            {clan.member_count} Combatants Detected
                                        </p>
                                    </div>

                                    <div className="bg-black/40 rounded-xl p-3 border border-white/5 group-hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-2 mb-1">
                                            <User className="w-3 h-3 text-gray-500" />
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Most Active Operative</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-gray-200 truncate pr-2">{clan.top_member}</span>
                                            <span className="text-[10px] font-mono bg-[#5865F2]/10 text-[#5865F2] px-1.5 py-0.5 rounded border border-[#5865F2]/20">
                                                {clan.top_member_activity}x
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-[10px] font-mono text-gray-600 uppercase">Archive Entry: {new Date(clan.last_scanned).toLocaleDateString()}</span>
                                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-[#5865F2] group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
