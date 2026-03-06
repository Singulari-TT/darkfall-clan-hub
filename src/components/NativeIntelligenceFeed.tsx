"use client";

import { useState, useEffect } from "react";
import { Loader2, ShieldAlert, Zap, Skull, Shield } from "lucide-react";

interface IntelligenceItem {
    id: string;
    [key: string]: any;
}

export default function NativeIntelligenceFeed({ type }: { type: 'ganks' | 'bans' }) {
    const [data, setData] = useState<IntelligenceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`/api/agon/${type}`);
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                } else {
                    setError(json.error || "Uplink Failed");
                }
            } catch (err) {
                setError("Signal Lost");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
        const interval = setInterval(fetchData, 60000); // Pulse every minute
        return () => clearInterval(interval);
    }, [type]);

    if (loading && data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500 font-mono animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin text-[#5865F2]" />
                <span className="text-[10px] tracking-[0.3em] uppercase">Synchronizing Neural Uplink...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-red-500/50 font-mono">
                <ShieldAlert className="w-12 h-12" />
                <span className="text-xs uppercase tracking-widest font-bold">{error}</span>
                <p className="text-[9px] text-gray-600 uppercase">External firewall detected. Retrying handshake...</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-hidden flex flex-col p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-widest uppercase flex items-center gap-3">
                        {type === 'ganks' ? <Zap className="text-amber-500" /> : <ShieldAlert className="text-red-500" />}
                        {type === 'ganks' ? 'Live Gank Feed' : 'Agon Ban Watch'}
                    </h2>
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-1">
                        Sourced: Rise of Agon Metrics / Global Intelligence
                    </p>
                </div>
                <div className="bg-[#5865F2]/10 border border-[#5865F2]/20 px-4 py-2 rounded-lg">
                    <span className="text-[10px] text-[#5865F2] font-bold uppercase tracking-widest">
                        {data.length} Signals Captured
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-separate border-spacing-y-2">
                    <thead>
                        <tr className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                            {type === 'ganks' ? (
                                <>
                                    <th className="px-4 py-2 font-black">Timestamp</th>
                                    <th className="px-4 py-2 font-black">Target</th>
                                    <th className="px-4 py-2 font-black">Killer</th>
                                    <th className="px-4 py-2 font-black">Sector</th>
                                </>
                            ) : (
                                <>
                                    <th className="px-4 py-2 font-black">Character</th>
                                    <th className="px-4 py-2 font-black">Reason</th>
                                    <th className="px-4 py-2 font-black">Sanction Date</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="text-xs font-mono">
                        {data.map((item, i) => (
                            <tr key={i} className="bg-white/5 hover:bg-white/10 transition-colors group">
                                {type === 'ganks' ? (
                                    <>
                                        <td className="px-4 py-3 text-gray-500 border-l border-white/5">{item.time}</td>
                                        <td className="px-4 py-3 font-bold text-gray-200 uppercase group-hover:text-[#5865F2]">
                                            <div className="flex items-center gap-2">
                                                <Skull className="w-3 h-3 text-gray-600" />
                                                {item.target}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-red-400 font-black uppercase italic tracking-tighter shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]">
                                            {item.killer}
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 border-r border-white/5">{item.location}</td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-4 py-3 border-l border-white/5 font-bold text-red-500 uppercase tracking-tight">{item.character}</td>
                                        <td className="px-4 py-3 text-gray-400 max-w-md truncate italic text-[11px]">{item.reason}</td>
                                        <td className="px-4 py-3 border-r border-white/5 text-gray-600 text-right">{item.date}</td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-[9px] text-gray-600 uppercase tracking-widest font-mono">
                <span>Auto-Refresh: 60s</span>
                <span className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                    System Decrypted
                </span>
            </div>
        </div>
    );
}
