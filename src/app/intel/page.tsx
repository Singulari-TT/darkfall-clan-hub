"use client";

import { useState, useRef, useEffect } from "react";
import { submitIntel, submitLootpack, fetchWeeklyLootpackLeaderboard } from "./actions";

export default function IntelPage() {
    const [activeTab, setActiveTab] = useState<"tactical" | "lootpack">("tactical");

    // Shared state
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Tactical state
    const [description, setDescription] = useState("");

    // Lootpack state
    const [lootValue, setLootValue] = useState<number | "">("");
    const [leaderboard, setLeaderboard] = useState<any[]>([]);

    const loadLeaderboard = async () => {
        const data = await fetchWeeklyLootpackLeaderboard();
        setLeaderboard(data);
    };

    useEffect(() => {
        loadLeaderboard();

        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1) {
                    const pastedFile = items[i].getAsFile();
                    if (pastedFile) handleFileSelect(pastedFile);
                    break;
                }
            }
        };
        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, []);

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target?.result as string);
        reader.readAsDataURL(selectedFile);
        setMessage(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) handleFileSelect(e.target.files[0]);
    };

    const clearForm = () => {
        setFile(null);
        setPreviewUrl(null);
        setDescription("");
        setLootValue("");
    };

    const handleTabChange = (tab: "tactical" | "lootpack") => {
        setActiveTab(tab);
        clearForm();
        setMessage(null);
    };

    const handleSubmitTactical = async (e: React.FormEvent) => {
        e.preventDefault();

        // Ensure either file OR description exists
        const hasText = description.trim().length > 0;
        if (!file && !hasText) {
            return setMessage({ type: "error", text: "Please provide either visual evidence OR a tactical text report." });
        }

        setIsSubmitting(true);
        setMessage(null);
        const formData = new FormData();
        if (file) formData.append("image", file);
        formData.append("description", description);

        try {
            const result = await submitIntel(formData);
            if (result.success) {
                setMessage({ type: "success", text: "Tactical intel relayed to High Command." });
                clearForm();
            } else setMessage({ type: "error", text: result.error || "Failed transmission." });
        } catch (error) {
            setMessage({ type: "error", text: "Critical system error." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitLootpack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return setMessage({ type: "error", text: "Visual proof required." });
        setIsSubmitting(true);
        setMessage(null);
        const formData = new FormData();
        formData.append("image", file);
        formData.append("value", lootValue.toString());
        try {
            const result = await submitLootpack(formData);
            if (result.success) {
                setMessage({ type: "success", text: "Loot haul recorded for the weekly contest!" });
                clearForm();
                await loadLeaderboard();
            } else setMessage({ type: "error", text: result.error || "Failed to log haul." });
        } catch (error) {
            setMessage({ type: "error", text: "Critical system error." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent text-gray-200 p-4 sm:p-8 font-sans selection:bg-[#5865F2]/30">
            <div className="max-w-7xl mx-auto space-y-8 relative z-10">

                <header className="border-b border-white/10 pb-6">
                    <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-sm uppercase tracking-wider mb-2">
                        Intelligence & <span className="text-[#5865F2]">Logistics</span>
                    </h1>
                    <p className="text-gray-400 font-sans text-lg">Report enemy movements or submit your farming yields for network rewards.</p>
                </header>

                {/* Highly Stylized Distinct Tab Buttons */}
                <div className="flex gap-4 border-b border-white/10 pb-6">
                    <button
                        onClick={() => handleTabChange("tactical")}
                        className={`relative px-8 py-3 rounded-lg font-bold uppercase tracking-widest text-sm transition-all duration-300 overflow-hidden group
                            ${activeTab === 'tactical'
                                ? 'bg-[#5865F2]/20 text-[#5865F2] border-2 border-[#5865F2]/50 shadow-[0_0_20px_rgba(88,101,242,0.2)] transform scale-105 backdrop-blur-md'
                                : 'bg-white/5 text-gray-500 border border-white/10 hover:border-[#5865F2]/50 hover:bg-white/10 hover:text-gray-300 hover:shadow-[0_0_10px_rgba(88,101,242,0.1)]'}`}
                    >
                        {activeTab === 'tactical' && <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#5865F2] to-transparent"></div>}
                        Tactical Report
                    </button>
                    <button
                        onClick={() => handleTabChange("lootpack")}
                        className={`relative px-8 py-3 rounded-lg font-bold uppercase tracking-widest text-sm transition-all duration-300 overflow-hidden group
                            ${activeTab === 'lootpack'
                                ? 'bg-[#10b981]/20 text-[#10b981] border-2 border-[#10b981]/50 shadow-[0_0_20px_rgba(16,185,129,0.2)] transform scale-105 backdrop-blur-md'
                                : 'bg-white/5 text-gray-500 border border-white/10 hover:border-[#10b981]/50 hover:bg-white/10 hover:text-gray-300 hover:shadow-[0_0_10px_rgba(16,185,129,0.1)]'}`}
                    >
                        {activeTab === 'lootpack' && <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#10b981] to-transparent"></div>}
                        Lootpack Contest
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <form onSubmit={activeTab === 'tactical' ? handleSubmitTactical : handleSubmitLootpack} className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${activeTab === 'tactical' ? 'via-[#5865F2]' : 'via-[#10b981]'} to-transparent opacity-50`}></div>

                            <h2 className={`text-xl font-bold ${activeTab === 'tactical' ? 'text-[#5865F2]' : 'text-[#10b981]'} mb-6 tracking-wide uppercase`}>
                                {activeTab === 'tactical' ? 'Submit Tactical Intel' : 'Log Farming Yield'}
                            </h2>

                            {message && (
                                <div className={`p-4 mb-6 rounded-lg border font-bold text-sm tracking-wide ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                                    {message.text}
                                </div>
                            )}

                            <div className="space-y-6">
                                {/* Image Input */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex justify-between">
                                        <span>Visual Evidence (CTRL+V to Paste)</span>
                                        {activeTab === 'tactical' && <span className="text-gray-600 font-sans text-[10px]">(Optional if providing text report)</span>}
                                    </label>
                                    <div
                                        className={`border-2 border-dashed rounded-2xl relative overflow-hidden flex items-center justify-center transition-colors min-h-[250px] cursor-pointer ${previewUrl ? 'border-[#5865F2]/50 bg-black/50' : `border-white/10 bg-black/40 hover:bg-black/60 hover:border-${activeTab === 'tactical' ? '[#5865F2]' : '[#10b981]'}/50`}`}
                                        onClick={() => !previewUrl && fileInputRef.current?.click()}
                                    >
                                        {previewUrl ? (
                                            <div className="relative w-full h-full p-2 group">
                                                <img src={previewUrl} alt="Preview" className="max-h-[400px] w-full object-contain rounded-xl" />
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewUrl(null); }}
                                                    className="absolute top-4 right-4 bg-black/80 border border-white/20 text-white p-2 rounded-lg hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.5)]"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center p-8 pointer-events-none">
                                                <span className="text-4xl opacity-50 mb-4 block">👁️</span>
                                                <p className="text-lg font-bold text-gray-400 tracking-wider">Click or Paste Image</p>
                                            </div>
                                        )}
                                        <input type="file" ref={fileInputRef} onChange={handleInputChange} accept="image/*" className="hidden" />
                                    </div>
                                </div>

                                {/* Form Specifics */}
                                {activeTab === 'tactical' ? (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex justify-between">
                                            <span>Coordinates & Tactical Analysis</span>
                                            <span className="text-gray-600 font-sans text-[10px]">(Optional if providing visual evidence)</span>
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Provide context, enemy strength, grid reference..."
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-gray-300 focus:border-[#5865F2]/50 outline-none transition-all resize-none font-sans"
                                            rows={3}
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex justify-between">
                                            <span>Estimated Yield Value</span>
                                            <span className="text-gray-600 font-sans text-[10px]">(Optional)</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={lootValue}
                                            onChange={(e) => setLootValue(parseInt(e.target.value) || "")}
                                            placeholder="e.g. 150000"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-gray-200 focus:border-[#10b981]/50 outline-none transition-colors font-mono tracking-wider text-xl"
                                        />
                                        <p className="text-xs text-gray-600 mt-2 font-sans">Enter the rough gold value of the submitted lootpack image.</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting || (activeTab === 'tactical' && !file && description.trim().length === 0) || (activeTab === 'lootpack' && !file)}
                                    className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all text-sm border shadow-sm
                                        ${isSubmitting || (activeTab === 'tactical' && !file && description.trim().length === 0) || (activeTab === 'lootpack' && !file)
                                            ? 'bg-white/5 text-gray-600 border-white/5 cursor-not-allowed'
                                            : activeTab === 'tactical'
                                                ? 'bg-[#5865F2]/90 hover:bg-[#5865F2] text-white border-[#5865F2] shadow-[0_4px_20px_rgba(88,101,242,0.3)] hover:-translate-y-0.5'
                                                : 'bg-[#10b981]/90 hover:bg-[#10b981] text-white border-[#10b981] shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5'}`}
                                >
                                    {isSubmitting ? 'Transmitting...' : activeTab === 'tactical' ? 'Relay Intelligence' : 'Submit for Contest'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Leaderboard */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl flex flex-col min-h-[500px]">
                            <h2 className="text-lg font-bold text-[#10b981] tracking-widest uppercase mb-1">
                                Yield Leaderboard
                            </h2>
                            <p className="text-xs text-gray-500 mb-6 border-b border-white/10 pb-4">
                                Highest yield wins <span className="text-emerald-400 font-bold">2 Theyril Ingots</span>.
                            </p>

                            <div className="flex-1 space-y-3">
                                {leaderboard.length === 0 ? (
                                    <div className="h-40 flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl bg-black/20">
                                        <span className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">No hauls this week</span>
                                    </div>
                                ) : (
                                    leaderboard.map((entry, idx) => (
                                        <div key={entry.id} className="bg-black/30 border border-white/5 rounded-xl p-3 flex items-center gap-3 hover:bg-black/50 transition-colors">
                                            <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-black ${idx === 0 ? 'bg-amber-400 text-amber-950 shadow-[0_0_15px_rgba(251,191,36,0.4)]' : idx === 1 ? 'bg-gray-300 text-gray-900' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-gray-200 truncate">{entry.Users?.display_name || "Unknown"}</h4>
                                                <p className="text-xs font-mono text-emerald-500/80">{entry.value.toLocaleString()} g</p>
                                            </div>
                                            {entry.image_url && (
                                                <a href={entry.image_url} target="_blank" rel="noopener noreferrer" className="shrink-0 p-1.5 bg-black/50 hover:bg-[#10b981]/20 rounded-md border border-white/10 text-[#10b981] transition-colors" title="View Proof">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                                </a>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
