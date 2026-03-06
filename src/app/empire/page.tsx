"use client";

import { useState, useEffect } from "react";
import { Hammer, Trees, Gem, Mountain, Activity, Shield, MapPin, TrendingUp, Loader2, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEmpireData() {
            setLoading(true);
            try {
                // Fetch holdings and their associated resource nodes
                const { data: holdingsData, error: hError } = await supabase
                    .from('Holdings')
                    .select(`
                        id, 
                        name, 
                        type, 
                        image_url,
                        Resource_Nodes (
                            type,
                            total_hits
                        )
                    `);

                if (hError) throw hError;

                const formattedHoldings: Holding[] = (holdingsData || []).map(h => {
                    const nodes = (h.Resource_Nodes || []).map((rn: any) => {
                        let yields: Record<string, number> = {};
                        if (rn.type === 'Timber Grove') {
                            yields = { 'Timber': rn.total_hits * 3, 'Resin': rn.total_hits * 2 };
                        } else if (rn.type === 'Quarry') {
                            yields = { 'Stone': rn.total_hits * 3, 'Sulfur': rn.total_hits * 0.2 };
                        } else if (rn.type === 'Mine') {
                            yields = { 'Iron Ore': rn.total_hits * 3, 'Coal': rn.total_hits * 2, 'Gold': 1 };
                        } else {
                            yields = { 'Resources': rn.total_hits * 3 };
                        }
                        return {
                            type: rn.type,
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
        fetchEmpireData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Accessing Imperial Registry...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] p-6 lg:p-10">
            <header className="mb-10">
                <div className="flex items-center gap-4 mb-2">
                    <Shield className="w-8 h-8 text-amber-500" />
                    <h1 className="text-3xl font-black text-white tracking-[0.2em] uppercase">Clan <span className="text-amber-500">Empire</span></h1>
                </div>
                <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em]">Imperial Holding & Resource Logistics Terminal</p>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {holdings.map((holding) => (
                    <div key={holding.id} className="group relative bg-[#0e0c10] border border-white/5 rounded-2xl overflow-hidden shadow-2xl hover:border-amber-500/30 transition-all duration-500">
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
                                    <div key={i} className="bg-black/40 border border-white/5 rounded-xl p-5 backdrop-blur-sm">
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

            <footer className="mt-12 pt-6 border-t border-white/5 text-center">
                <p className="text-[9px] text-gray-600 uppercase tracking-[0.4em] font-mono italic">
                    All yields are estimations based on neural news reel parsing (Milestone: 1, 10, 20...)
                </p>
            </footer>
        </div>
    );
}
