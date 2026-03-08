"use client";

import { useState, useEffect } from "react";
import { Hammer, Trees, Gem, Mountain, Activity, Shield, MapPin, TrendingUp, Loader2, Zap, RefreshCw, Clock, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";

interface Holding {
    id: string;
    name: string;
    type: 'City' | 'Hamlet';
    image_url?: string;
    nodes: {
        type: string;
        totalHits: number;
        estimatedYields: Record<string, number>;
    }[];
}

export default function EmpirePage() {
    const { data: session } = useSession();
    // @ts-ignore
    const isAdmin = session?.user?.role === 'Admin';

    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    async function fetchEmpireData() {
        setLoading(true);
        try {
            // Fetch last sync from SystemConfig
            const { data: syncData } = await supabase
                .from('SystemConfig')
                .select('updated_at')
                .eq('key', 'holdings_last_synced')
                .single();

            if (syncData) setLastSync(syncData.updated_at);

            // Fetch holdings and their associated resource nodes
            const { data: holdingsData, error: hError } = await supabase
                .from('Holdings')
                .select(`
                    id, 
                    name, 
                    type, 
                    image_url,
                    Resource_Nodes (
                        node_type,
                        total_hits
                    )
                `);

            if (hError) throw hError;

            const formattedHoldings: Holding[] = (holdingsData || []).map(h => {
                const nodes = (h.Resource_Nodes || []).map((rn: any) => {
                    let yields: Record<string, number> = {};
                    if (rn.node_type === 'Timber Grove') {
                        yields = { 'Timber': rn.total_hits * 3, 'Resin': rn.total_hits * 2 };
                    } else if (rn.node_type === 'Quarry') {
                        yields = { 'Stone': (rn.total_hits || 0) * 3, 'Sulfur': (rn.total_hits || 0) * 0.2 };
                    } else if (rn.node_type === 'Mine') {
                        yields = { 'Iron Ore': (rn.total_hits || 0) * 3, 'Coal': (rn.total_hits || 0) * 2, 'Gold': 1 };
                    } else {
                        yields = { 'Resources': (rn.total_hits || 0) * 3 };
                    }
                    return {
                        type: rn.node_type,
                        totalHits: rn.total_hits || 0,
                        estimatedYields: yields
                    };
                });

                return {
                    id: h.id,
                    name: h.name,
                    type: h.type as 'City' | 'Hamlet',
                    image_url: h.image_url,
                    nodes: nodes
                };
            });

            setHoldings(formattedHoldings);
        } catch (err) {
            console.error("Failed to load empire data:", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchEmpireData();
    }, []);

    const handleRefresh = async () => {
        if (refreshing) return;
        setRefreshing(true);
        setStatusMessage(null);
        try {
            const res = await fetch('/api/admin/trigger-scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ script: 'holdings-sync' })
            });

            const data = await res.json();
            if (data.success) {
                setStatusMessage({ text: "Empire sync successful! Holdings updated.", type: 'success' });
                await fetchEmpireData();
            } else {
                setStatusMessage({ text: data.message || "Sync failed. Game servers likely in maintenance.", type: 'error' });
            }
        } catch (err) {
            setStatusMessage({ text: "A network error occurred during sync.", type: 'error' });
        } finally {
            setRefreshing(false);
            // Clear message after 5 seconds
            setTimeout(() => setStatusMessage(null), 5000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Accessing Imperial Registry...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent p-6 lg:p-10 selection:bg-social-cobalt-dim">
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-6">
                    <Link
                        href="/"
                        className="p-2.5 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10 group"
                        title="Back to Command"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-amber-500" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <Shield className="w-8 h-8 text-amber-500" />
                            <h1 className="text-3xl font-black text-white tracking-[0.2em] uppercase">Clan <span className="text-amber-500">Empire</span></h1>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em]">Imperial Holding & Resource Logistics Terminal</p>
                        {lastSync && (
                            <div className="flex items-center gap-1.5 text-[9px] text-gray-600 font-mono uppercase tracking-widest mt-1">
                                <Clock className="w-3 h-3" />
                                Last Global Sync: <span className="text-amber-500/70">{new Date(lastSync).toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                </div>

                {isAdmin && (
                    <div className="flex flex-col items-end gap-3">
                        {statusMessage && (
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-2 duration-300 ${statusMessage.type === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                : 'bg-red-500/10 border-red-500/30 text-red-500'
                                }`}>
                                {statusMessage.type === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                {statusMessage.text}
                            </div>
                        )}
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="group relative flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 px-4 py-2 rounded-card transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw className={`w-4 h-4 text-amber-500 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Refresh Sync</span>
                        </button>
                    </div>
                )}
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {holdings.map((holding) => (
                    <div key={holding.id} className="group relative bg-surface border border-surface-border rounded-card overflow-hidden shadow-2xl hover:border-amber-500/30 transition-all duration-500 backdrop-blur-[--blur-glass]">
                        {/* Background Image / Placeholder */}
                        <div className="absolute inset-0 opacity-10 grayscale group-hover:grayscale-0 group-hover:opacity-20 transition-all duration-700">
                            {holding.image_url ? (
                                <img src={holding.image_url} alt={holding.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#5865F2]/20 to-black"></div>
                            )}
                        </div>

                        <div className="relative p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 text-amber-500 mb-1">
                                        <MapPin className="w-3 h-3" />
                                        <span className="text-[9px] font-black uppercase tracking-tighter">{holding.type} SECURED</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-wider">{holding.name}</h2>
                                </div>
                                <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg backdrop-blur-md">
                                    <span className="text-[9px] text-gray-400 font-mono uppercase tracking-widest">Status: <span className="text-emerald-500">Active</span></span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {holding.nodes.map((node, i) => (
                                    <div key={i} className="bg-black/20 border border-white/5 rounded-xl p-5 backdrop-blur-sm">
                                        <div className="flex items-center gap-3 mb-3">
                                            {node.type === 'Timber Grove' && <Trees className="w-4 h-4 text-emerald-500" />}
                                            {node.type === 'Mine' && <Mountain className="w-4 h-4 text-gray-400" />}
                                            {node.type === 'Quarry' && <Hammer className="w-4 h-4 text-stone-500" />}
                                            {!(['Timber Grove', 'Mine', 'Quarry'].includes(node.type)) && <Zap className="w-4 h-4 text-amber-500" />}
                                            <h3 className="text-xs font-bold text-gray-200 uppercase tracking-widest">{node.type}</h3>
                                        </div>

                                        <div className="space-y-2.5">
                                            {Object.entries(node.estimatedYields).map(([resource, amount]) => (
                                                <div key={resource} className="flex justify-between items-center text-[10px]">
                                                    <span className="text-gray-500 uppercase font-mono">{resource}</span>
                                                    <span className="text-white font-black tabular-nums">{Math.floor(amount)}</span>
                                                </div>
                                            ))}
                                            <div className="pt-2.5 mt-2.5 border-t border-white/5 flex justify-between items-center text-[9px]">
                                                <span className="text-gray-600 uppercase italic">Total Hits Detected</span>
                                                <span className="text-amber-500/50 font-bold">{node.totalHits}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between text-[9px] text-gray-700 font-mono uppercase tracking-[0.2em]">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-2.5 h-2.5 text-emerald-500 animate-pulse" />
                                    Live News Reel Sync
                                </div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-2.5 h-2.5 text-[#5865F2]" />
                                    Yield Efficiency: <span className="text-emerald-500/80 italic">Optimal / Tracking Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Hardcoded yield note */}
            </div>

            <footer className="mt-12 pt-6 border-t border-surface-border text-center">
                <p className="text-[9px] text-gray-600 uppercase tracking-[0.4em] font-mono italic">
                    All yields are estimations based on neural news reel parsing (Milestone: 1, 10, 20...)
                </p>
            </footer>
        </div>
    );
}
