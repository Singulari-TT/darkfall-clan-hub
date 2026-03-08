"use client";

import { useEffect, useState } from "react";
import { fetchSystemSettings, updateSystemSettings, fetchSystemVitality } from "./actions";
import { Activity, Radio, Cloud, Zap, Server, Clock, CheckCircle2, X } from "lucide-react";

export default function SettingsPage() {
    const [marketUrl, setMarketUrl] = useState("");
    const [opsUrl, setOpsUrl] = useState("");
    const [intelUrl, setIntelUrl] = useState("");
    const [vitality, setVitality] = useState<any[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "ok" | "error", text: string } | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const [settings, vitData] = await Promise.all([
                    fetchSystemSettings(),
                    fetchSystemVitality()
                ]);

                if (settings) {
                    setMarketUrl(settings.market);
                    setOpsUrl(settings.ops);
                    setIntelUrl(settings.intel);
                }
                setVitality(vitData || []);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);
        try {
            await updateSystemSettings(marketUrl, opsUrl, intelUrl);
            setMessage({ type: "ok", text: "Settings saved successfully." });
        } catch (e: any) {
            setMessage({ type: "error", text: e.message || "Failed to save." });
        } finally {
            setIsSaving(false);
        }
    };

    const getVitalityLabel = (key: string) => {
        switch (key) {
            case 'last_roster_sync': return 'Roster Intelligence Explorer';
            case 'last_gank_intel_sync': return 'Lethality Sensor (Gank Feed)';
            case 'last_harvest_scraper_sync': return 'News Reel Archive (Harvests)';
            case 'members_logged_in': return 'Live Population Pulse';
            default: return key;
        }
    };

    const getVitalityIcon = (key: string) => {
        switch (key) {
            case 'last_roster_sync': return <Radio className="w-4 h-4 text-blue-500" />;
            case 'last_gank_intel_sync': return <Radio className="w-4 h-4 text-red-500" />;
            case 'last_harvest_scraper_sync': return <Radio className="w-4 h-4 text-emerald-500" />;
            case 'members_logged_in': return <Activity className="w-4 h-4 text-[#c5a059]" />;
            default: return <Server className="w-4 h-4 text-gray-400" />;
        }
    };

    if (isLoading) return (
        <div className="min-h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-[#c5a059] animate-spin" />
                <span className="text-[#c5a059] font-heading uppercase tracking-widest text-xs">Initializing System Coordinates...</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* --- SYSTEM VITALITY --- */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-[#c5a059]/10 p-2 rounded-lg border border-[#c5a059]/20 shadow-[0_0_15px_rgba(197,160,89,0.1)]">
                        <Activity className="w-5 h-5 text-[#c5a059]" />
                    </div>
                    <h2 className="text-xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#c5a059]/60 uppercase tracking-widest">
                        System Vitality
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {vitality.length > 0 ? vitality.map((v) => (
                        <div key={v.key} className="bg-black/40 border border-red-900/20 p-4 rounded-xl hover:border-red-900/50 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-red-900/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
                            <div className="flex items-center gap-3 mb-3 relative z-10">
                                <div className="p-2 bg-black/40 rounded-lg border border-red-900/20">
                                    {getVitalityIcon(v.key)}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 group-hover:text-gray-300 transition-colors">
                                    {getVitalityLabel(v.key)}
                                </span>
                            </div>
                            <div className="flex items-end justify-between relative z-10">
                                <div className="flex flex-col">
                                    <span className="text-lg font-mono font-bold text-gray-200">
                                        {v.updated_at ? new Date(v.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'OFFLINE'}
                                    </span>
                                    <span className="text-[9px] font-mono text-stone-600 uppercase">Last Sequence</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Active</span>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full border border-dashed border-red-900/30 rounded-xl p-8 text-center bg-black/20">
                            <Server className="w-8 h-8 text-stone-800 mx-auto mb-3" />
                            <p className="text-stone-600 font-serif italic text-sm">No vitality data detected in the mainframe.</p>
                        </div>
                    )}
                </div>
            </section>

            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-red-900/10 p-2 rounded-lg border border-red-900/20">
                        <Radio className="w-5 h-5 text-red-500" />
                    </div>
                    <h2 className="text-xl font-heading font-bold text-[#c5a059] uppercase tracking-widest">
                        Discord Integration Loops
                    </h2>
                </div>

                <p className="text-sm text-stone-400 font-serif italic mb-6 max-w-2xl">
                    Configure webhooks to pipe real-time intelligence loops directly into the Dreadkrew Discord hub.
                </p>

                <form onSubmit={handleSave} className="bg-[#1a151b]/60 border border-red-900/30 p-8 rounded-2xl shadow-2xl backdrop-blur-sm space-y-8 max-w-4xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-[#c5a059] uppercase tracking-[0.2em] mb-2 opacity-70">
                                    Operations & Event Webhook
                                </label>
                                <input
                                    type="url"
                                    value={opsUrl}
                                    onChange={(e) => setOpsUrl(e.target.value)}
                                    placeholder="https://discord.com/api/webhooks/..."
                                    className="w-full bg-[#0e0c10]/80 border border-red-900/30 rounded-xl px-4 py-3.5 text-gray-200 focus:border-red-600 font-mono text-xs outline-none transition-all shadow-inner"
                                />
                                <p className="text-[10px] text-stone-600 mt-2 font-serif italic">Sieges, Patrols, and Main Events.</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-[#c5a059] uppercase tracking-[0.2em] mb-2 opacity-70">
                                    Market Logistics Webhook
                                </label>
                                <input
                                    type="url"
                                    value={marketUrl}
                                    onChange={(e) => setMarketUrl(e.target.value)}
                                    placeholder="https://discord.com/api/webhooks/..."
                                    className="w-full bg-[#0e0c10]/80 border border-red-900/30 rounded-xl px-4 py-3.5 text-gray-200 focus:border-red-600 font-mono text-xs outline-none transition-all shadow-inner"
                                />
                                <p className="text-[10px] text-stone-600 mt-2 font-serif italic">Buy/Sell orders and Vault movement.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-[#c5a059] uppercase tracking-[0.2em] mb-2 opacity-70">
                                    Intel & Scouting Webhook
                                </label>
                                <input
                                    type="url"
                                    value={intelUrl}
                                    onChange={(e) => setIntelUrl(e.target.value)}
                                    placeholder="https://discord.com/api/webhooks/..."
                                    className="w-full bg-[#0e0c10]/80 border border-red-900/30 rounded-xl px-4 py-3.5 text-gray-200 focus:border-red-600 font-mono text-xs outline-none transition-all shadow-inner"
                                />
                                <p className="text-[10px] text-stone-600 mt-2 font-serif italic">Map reports and Gank Intelligence.</p>
                            </div>

                            <div className="flex flex-col justify-end h-full">
                                {message && (
                                    <div className={`p-4 rounded-xl text-[10px] font-black tracking-widest border transition-all animate-in slide-in-from-top-2 ${message.type === 'ok' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50' : 'bg-red-950/30 text-red-500 border-red-900/50'}`}>
                                        <div className="flex items-center gap-2">
                                            {message.type === 'ok' ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                            {message.text.toUpperCase()}
                                        </div>
                                    </div>
                                )}
                                <div className="mt-auto pt-6">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="w-full bg-gradient-to-br from-red-600 to-black hover:to-red-900 border border-red-900 hover:border-red-500 text-white font-heading font-black uppercase tracking-widest text-xs px-6 py-4 rounded-xl shadow-[0_10px_30px_rgba(139,0,0,0.4)] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                                        ) : (
                                            <Zap className="w-4 h-4 text-white" />
                                        )}
                                        {isSaving ? "RE-SEQUENCING..." : "COMMIT TO MAINFRAME"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </section>
        </div>
    );
}

function Loader2({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
    )
}
