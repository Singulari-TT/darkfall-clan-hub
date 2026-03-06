"use client";

import { useState } from "react";
import InteractiveMap from "@/components/InteractiveMap";
import WarRoomIntro from "@/components/WarRoomIntro";
import NativeIntelligenceFeed from "@/components/NativeIntelligenceFeed";

type WarRoomTab = "map" | "ganks" | "bans" | "heatmap";

export default function WarRoomPage() {
    const [hasEntered, setHasEntered] = useState(false);
    const [activeTab, setActiveTab] = useState<WarRoomTab>("map");

    const tabs: { id: WarRoomTab; label: string; icon: string; url?: string }[] = [
        { id: "map", label: "Tactical Map", icon: "🗺️" },
        { id: "ganks", label: "Gank Feed", icon: "⚔️", url: "https://www.riseofagon.com/agonmetrics/pvp/global/" },
        { id: "bans", label: "Ban Watch", icon: "🚫", url: "https://www.riseofagon.com/bans/" },
        { id: "heatmap", label: "HeatMap", icon: "🔥", url: "https://www.riseofagon.com/agonmetrics/pvp/heatmap/" },
    ];

    return (
        <div className="min-h-screen bg-[#020617] text-gray-300 font-sans relative overflow-hidden">
            {!hasEntered && <WarRoomIntro onEnter={() => setHasEntered(true)} />}

            <div className={`transition-all duration-1000 ${hasEntered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"} h-screen flex flex-col`}>
                {/* War Room Sub-Header / Navigation */}
                <header className="bg-black/40 backdrop-blur-md border-b border-white/10 px-6 py-3 flex items-center justify-between z-50">
                    <div className="flex items-center gap-6">
                        <h1 className="text-xl font-black tracking-widest text-white uppercase flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            War Room <span className="text-[#5865F2]">Terminal</span>
                        </h1>

                        <nav className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 border ${activeTab === tab.id
                                        ? "bg-[#5865F2]/20 text-[#5865F2] border-[#5865F2]/40 shadow-[0_0_15px_rgba(88,101,242,0.2)]"
                                        : "text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5"
                                        }`}
                                >
                                    <span>{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-emerald-500"></span> Uplink Active</span>
                        <span className="text-white/20">|</span>
                        <span>Agon Intelligence Systems Sync: 100%</span>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 relative bg-black/20">
                    {activeTab === "map" && (
                        <div className="absolute inset-0 p-8 flex items-center justify-center">
                            <div className="w-full h-full max-w-[75%] mx-auto bg-transparent rounded-2xl relative overflow-hidden border border-white/10 shadow-3xl">
                                <InteractiveMap />
                                {/* Tactical Overlays */}
                                <div className="absolute top-4 left-4 z-40 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-tighter text-blue-400">
                                    GRID_ALPHA_V1 / LIVE_COORD_TRACKING
                                </div>
                            </div>
                        </div>
                    )}

                    {(activeTab === "ganks" || activeTab === "bans") && (
                        <div className="absolute inset-0 bg-[#0a0f18] flex items-center justify-center p-8">
                            <div className="w-full h-full max-w-[85%] bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">
                                <NativeIntelligenceFeed type={activeTab} />
                            </div>
                        </div>
                    )}

                    {activeTab === "heatmap" && (
                        <div className="absolute inset-0 bg-[#0a0f18] flex flex-col items-center justify-center p-8 text-center">
                            <div className="max-w-2xl mb-8">
                                <h2 className="text-3xl font-black text-white tracking-[0.2em] uppercase mb-4">Tactical HeatMap</h2>
                                <p className="text-sm text-gray-500 font-mono">External security protocols (X-Frame-Options) prevent direct terminal rendering of the HeatMap. Access via secure external uplink below.</p>
                            </div>

                            <a
                                href="https://www.riseofagon.com/agonmetrics/pvp/heatmap/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative px-10 py-4 bg-red-500/10 border border-red-500/50 hover:bg-red-500 hover:text-white transition-all duration-500 rounded-xl overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-red-400/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                <span className="relative z-10 font-black tracking-[0.3em] uppercase">Establish Direct Uplink</span>
                            </a>

                            <div className="mt-12 w-full max-w-md h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                            <p className="mt-8 text-[10px] text-gray-700 uppercase tracking-widest italic">Note: Neural interface currently restricted to browser-native view.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
