"use client";

import { useEffect, useState } from "react";
import { fetchSystemSettings, updateSystemSettings } from "./actions";

export default function SettingsPage() {
    const [marketUrl, setMarketUrl] = useState("");
    const [opsUrl, setOpsUrl] = useState("");
    const [intelUrl, setIntelUrl] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "ok" | "error", text: string } | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const settings = await fetchSystemSettings();
                if (settings) {
                    setMarketUrl(settings.market);
                    setOpsUrl(settings.ops);
                    setIntelUrl(settings.intel);
                }
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

    if (isLoading) return <div className="text-[#c5a059] font-heading uppercase tracking-widest animate-pulse">Initializing System Coordinates...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div>
                <h2 className="text-xl font-heading font-bold text-[#c5a059] uppercase tracking-widest border-b border-red-900/30 pb-2 mb-4">
                    Discord Integration Settings
                </h2>
                <p className="text-sm text-stone-400 font-serif italic mb-6">
                    Configure webhooks to pipe real-time intelligence loops directly into the Dreadkrew Discord hub.
                </p>

                <form onSubmit={handleSave} className="bg-[#1a151b] border border-red-900/30 p-6 rounded-lg shadow-inner space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-[#c5a059] uppercase tracking-widest mb-1">
                            Operations & Event Webhook
                        </label>
                        <p className="text-xs text-stone-500 mb-2 font-serif italic">Receives automated alerts when new Sieges, Patols, and Clan Events are scheduled.</p>
                        <input
                            type="url"
                            value={opsUrl}
                            onChange={(e) => setOpsUrl(e.target.value)}
                            placeholder="https://discord.com/api/webhooks/..."
                            className="w-full bg-[#0e0c10] border border-red-900/50 rounded px-4 py-3 text-gray-200 focus:border-[#c5a059] font-mono text-sm outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#c5a059] uppercase tracking-widest mb-1">
                            Market Logistics Webhook
                        </label>
                        <p className="text-xs text-stone-500 mb-2 font-serif italic">Powers the "Send to Discord" command in the Bank Market for buy/sell operations.</p>
                        <input
                            type="url"
                            value={marketUrl}
                            onChange={(e) => setMarketUrl(e.target.value)}
                            placeholder="https://discord.com/api/webhooks/..."
                            className="w-full bg-[#0e0c10] border border-red-900/50 rounded px-4 py-3 text-gray-200 focus:border-[#c5a059] font-mono text-sm outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#c5a059] uppercase tracking-widest mb-1">
                            Intel & Scouting Webhook
                        </label>
                        <p className="text-xs text-stone-500 mb-2 font-serif italic">Receives Tactical Map reports and Lootpack contest submissions natively.</p>
                        <input
                            type="url"
                            value={intelUrl}
                            onChange={(e) => setIntelUrl(e.target.value)}
                            placeholder="https://discord.com/api/webhooks/..."
                            className="w-full bg-[#0e0c10] border border-red-900/50 rounded px-4 py-3 text-gray-200 focus:border-[#c5a059] font-mono text-sm outline-none transition-colors"
                        />
                    </div>

                    {message && (
                        <div className={`p-3 rounded text-sm font-black tracking-widest border \${message.type === 'ok' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-900/50' : 'bg-red-900/20 text-red-500 border-red-900/50'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-red-900/30">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-gradient-to-r from-red-900 to-black hover:from-red-800 border border-red-900 hover:border-red-500 text-white font-heading font-black uppercase tracking-widest text-sm px-6 py-3 rounded shadow-[0_0_15px_rgba(139,0,0,0.3)] transition-all"
                        >
                            {isSaving ? "Persisting to Mainframe..." : "Engage Protocol & Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
