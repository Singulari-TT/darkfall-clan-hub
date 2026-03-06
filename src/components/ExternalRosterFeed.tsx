"use client";

import { useState, useEffect } from "react";
import { Loader2, Users, Sword, Shield, Calendar, ExternalLink, ChevronRight, ChevronDown } from "lucide-react";

interface ExternalMember {
    name: string;
    lastSeen: string;
    count: number;
}

interface ExternalClan {
    name: string;
    totalActivity: number;
    members: ExternalMember[];
}

export default function ExternalRosterFeed() {
    const [clans, setClans] = useState<ExternalClan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedClan, setExpandedClan] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/intel/external-rosters");
            const data = await res.json();
            if (data.success) {
                setClans(data.clans);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 300000); // Refesh every 5 mins
        return () => clearInterval(interval);
    }, []);

    if (isLoading && clans.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
                <Loader2 className="w-8 h-8 text-[#5865F2] animate-spin" />
                <p className="text-[#5865F2] font-mono text-xs tracking-widest uppercase animate-pulse">Scanning Global Gank History...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="bg-[#5865F2]/10 border border-[#5865F2]/20 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-[#5865F2]" />
                    <h3 className="text-sm font-bold text-white tracking-widest uppercase">External Roster Intel</h3>
                </div>
                <p className="text-xs text-gray-400 font-sans italic">
                    Analyzing global Agon Metrics PvP history to deduce active enemy and ally rosters.
                    Tracking the most combat-active characters in the last 24 hours.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {clans.map((clan) => (
                    <div key={clan.name} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all">
                        <button
                            onClick={() => setExpandedClan(expandedClan === clan.name ? null : clan.name)}
                            className="w-full flex items-center justify-between p-4 bg-black/20 hover:bg-black/40 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-[#5865F2]/10 flex items-center justify-center border border-[#5865F2]/20">
                                    <Users className="w-5 h-5 text-[#5865F2]" />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-white tracking-tight">{clan.name}</h4>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">{clan.members.length} Active Operatives</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="flex items-center gap-2">
                                        <Sword className="w-3.5 h-3.5 text-rose-500" />
                                        <span className="text-sm font-bold text-white">{clan.totalActivity}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 uppercase">Recent Activity</p>
                                </div>
                                {expandedClan === clan.name ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                            </div>
                        </button>

                        {expandedClan === clan.name && (
                            <div className="p-4 border-t border-white/5 space-y-3 animate-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {clan.members.map((member) => (
                                        <div key={member.name} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-lg px-3 py-2 group hover:border-[#5865F2]/30 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                                                <span className="text-xs font-bold text-gray-200">{member.name}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-mono text-gray-500" title="Last Spotted">
                                                    {member.lastSeen}
                                                </span>
                                                <div className="bg-[#5865F2]/10 px-1.5 py-0.5 rounded border border-[#5865F2]/20 text-[10px] font-bold text-[#5865F2]">
                                                    {member.count}x
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <a
                                    href={`https://www.riseofagon.com/agonmetrics/clan/${clan.name.toLowerCase().replace(/\s+/g, '-')}/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-2 mt-2 bg-white/5 hover:bg-[#5865F2]/20 text-gray-400 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border border-transparent hover:border-[#5865F2]/30"
                                >
                                    Full Clan Profile <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
