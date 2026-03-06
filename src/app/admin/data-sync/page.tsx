"use client";

import { useState } from "react";

type ScriptResult = { success: boolean; processed?: number; note?: string; error?: string };

const SCRIPTS = [
    {
        id: "online-status",
        label: "Sync Online Status",
        description: "Scrapes the news reel and parses which clan members are currently logged in.",
        icon: "📡",
        color: "emerald",
    },
    {
        id: "harvest-sync",
        label: "Sync Harvest Data",
        description: "Parses harvest events from the news reel and updates resource node total hits in the Empire database.",
        icon: "⛏️",
        color: "amber",
    },
];

const colorMap: Record<string, { border: string; bg: string; text: string; btn: string }> = {
    emerald: {
        border: "border-emerald-900/50 hover:border-emerald-500/50",
        bg: "bg-emerald-500/5",
        text: "text-emerald-400",
        btn: "bg-emerald-500/20 hover:bg-emerald-500/40 border-emerald-500/40 hover:border-emerald-400 text-emerald-300",
    },
    amber: {
        border: "border-amber-900/50 hover:border-amber-500/50",
        bg: "bg-amber-500/5",
        text: "text-amber-400",
        btn: "bg-amber-500/20 hover:bg-amber-500/40 border-amber-500/40 hover:border-amber-400 text-amber-300",
    },
};

export default function DataSyncPage() {
    const [results, setResults] = useState<Record<string, ScriptResult | "loading">>({});

    const run = async (scriptId: string) => {
        setResults(prev => ({ ...prev, [scriptId]: "loading" }));
        try {
            const res = await fetch("/api/admin/trigger-scrape", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ script: scriptId }),
            });
            const data = await res.json();
            setResults(prev => ({ ...prev, [scriptId]: data }));
        } catch (e: any) {
            setResults(prev => ({ ...prev, [scriptId]: { success: false, error: e.message } }));
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold text-[#c5a059] uppercase tracking-widest mb-1">Manual Data Sync</h2>
                <p className="text-stone-500 text-sm font-serif italic">
                    Trigger scraper jobs manually. Use for one-time syncs or when the cron hasn't caught up yet.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SCRIPTS.map(script => {
                    const result = results[script.id];
                    const isLoading = result === "loading";
                    const c = colorMap[script.color];

                    return (
                        <div
                            key={script.id}
                            className={`border ${c.border} ${c.bg} rounded-xl p-5 transition-all space-y-4`}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">{script.icon}</span>
                                <div>
                                    <h3 className={`font-bold text-sm uppercase tracking-widest ${c.text}`}>{script.label}</h3>
                                    <p className="text-stone-500 text-xs mt-1 font-serif">{script.description}</p>
                                </div>
                            </div>

                            {/* Result */}
                            {result && result !== "loading" && (
                                <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${result.success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                                    {result.success
                                        ? `✓ ${result.note} (${result.processed} records)`
                                        : `✗ ${result.error}`}
                                </div>
                            )}

                            <button
                                onClick={() => run(script.id)}
                                disabled={isLoading}
                                className={`w-full py-2.5 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all ${isLoading ? "opacity-50 cursor-not-allowed bg-white/5 border-white/10 text-gray-500" : c.btn}`}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        Running...
                                    </span>
                                ) : (
                                    `▶ Run ${script.label}`
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="border border-red-900/20 rounded-xl p-4 bg-black/20">
                <p className="text-[10px] text-stone-600 font-mono uppercase tracking-widest">
                    ⚠ These scripts connect directly to the Darkfall game API. Run sparingly. The online-status cron runs automatically every 10 minutes via GitHub Actions.
                </p>
            </div>
        </div>
    );
}
