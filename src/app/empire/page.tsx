"use client";

import { useState, useEffect } from "react";
import { Hammer, Trees, Gem, Mountain, Activity, Shield, MapPin, TrendingUp } from "lucide-react";

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
    const [holdings, setHoldings] = useState<Holding[]>([
        {
            id: '1',
            name: 'Greybark',
            type: 'City',
            nodes: [
                {
                    type: 'Timber Grove',
                    totalHits: 450,
                    estimatedYields: { 'Timber': 1350, 'Resin': 900, 'Mahogany': 22 }
                },
                {
                    type: 'Quarry',
                    totalHits: 210,
                    estimatedYields: { 'Stone': 630, 'Sulfur': 42 }
                }
            ]
        },
        {
            id: '2',
            name: 'Ochre Mines',
            type: 'Hamlet',
            nodes: [
                {
                    type: 'Mine',
                    totalHits: 890,
                    estimatedYields: { 'Iron Ore': 2670, 'Coal': 1780, 'Gold': 5 }
                }
            ]
        }
    ]);

    return (
        <div className="min-h-screen bg-[#020617] p-8">
            <header className="mb-12">
                <div className="flex items-center gap-4 mb-2">
                    <Shield className="w-8 h-8 text-amber-500" />
                    <h1 className="text-4xl font-black text-white tracking-[0.2em] uppercase">Clan <span className="text-amber-500">Empire</span></h1>
                </div>
                <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.3em]">Imperial Holding & Resource Logistics Terminal</p>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {holdings.map((holding) => (
                    <div key={holding.id} className="group relative bg-[#0e0c10] border border-white/5 rounded-3xl overflow-hidden shadow-2xl hover:border-amber-500/30 transition-all duration-500">
                        {/* Background Image / Placeholder */}
                        <div className="absolute inset-0 opacity-10 grayscale group-hover:grayscale-0 group-hover:opacity-20 transition-all duration-700">
                            {holding.image_url ? (
                                <img src={holding.image_url} alt={holding.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#5865F2]/20 to-black"></div>
                            )}
                        </div>

                        <div className="relative p-8">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <div className="flex items-center gap-2 text-amber-500 mb-1">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-tighter">{holding.type} SECURED</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-wider">{holding.name}</h2>
                                </div>
                                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                                    <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">Status: <span className="text-emerald-500">Active</span></span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {holding.nodes.map((node, i) => (
                                    <div key={i} className="bg-black/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                                        <div className="flex items-center gap-3 mb-4">
                                            {node.type === 'Timber Grove' && <Trees className="w-5 h-5 text-emerald-500" />}
                                            {node.type === 'Mine' && <Mountain className="w-5 h-5 text-gray-400" />}
                                            {node.type === 'Quarry' && <Hammer className="w-5 h-5 text-stone-500" />}
                                            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-widest">{node.type}</h3>
                                        </div>

                                        <div className="space-y-3">
                                            {Object.entries(node.estimatedYields).map(([resource, amount]) => (
                                                <div key={resource} className="flex justify-between items-center text-[11px]">
                                                    <span className="text-gray-500 uppercase font-mono">{resource}</span>
                                                    <span className="text-white font-black tabular-nums">{amount}</span>
                                                </div>
                                            ))}
                                            <div className="pt-3 mt-3 border-t border-white/5 flex justify-between items-center text-[10px]">
                                                <span className="text-gray-600 uppercase italic">Total Hits Detected</span>
                                                <span className="text-amber-500/50 font-bold">{node.totalHits}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-gray-700 font-mono uppercase tracking-[0.2em]">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                                    Live News Reel Sync
                                </div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-3 h-3 text-[#5865F2]" />
                                    Yield Efficiency: 98.4%
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add Holding Placeholder */}
                <div className="border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center p-12 text-center group hover:border-[#5865F2]/50 hover:bg-[#5865F2]/5 transition-all cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Shield className="w-8 h-8 text-gray-700 group-hover:text-[#5865F2]" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-500 uppercase tracking-widest mb-1 group-hover:text-gray-300">Register New Holding</h3>
                    <p className="text-[10px] text-gray-700 uppercase tracking-widest font-mono">Expand Imperial Dominance</p>
                </div>
            </div>

            <footer className="mt-16 pt-8 border-t border-white/5 text-center">
                <p className="text-[10px] text-gray-600 uppercase tracking-[0.4em] font-mono italic">
                    All yields are estimations based on neural news reel parsing (Milestone: 1, 10, 20...)
                </p>
            </footer>
        </div>
    );
}
