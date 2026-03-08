"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Users, Sword, Shield, Clock, Camera, Send, Loader2, Info } from "lucide-react";
import { submitIntel } from "../../intel/actions";

interface Member {
    name: string;
    lastSeen: string;
    count: number;
}

interface ClanData {
    clan_name: string;
    member_count: number;
    total_activity: number;
    members: Member[];
    last_scanned: string;
}

export default function ClanDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const clanName = params ? decodeURIComponent(params.clanName as string) : "";


    const [clanData, setClanData] = useState<ClanData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Intel form state
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchClan = async () => {
            setIsLoading(true);
            try {
                const res = await fetch("/api/roster/clans");
                const data = await res.json();
                if (data.success) {
                    const found = data.clans.find((c: any) => c.clan_name === clanName);
                    setClanData(found || null);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchClan();
    }, [clanName]);

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target?.result as string);
        reader.readAsDataURL(selectedFile);
    };

    const handlePaste = (e: React.ClipboardEvent) => {
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

    const handleSubmitIntel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file && !description.trim()) return;

        setIsSubmitting(true);
        setMessage(null);

        const formData = new FormData();
        if (file) formData.append("image", file);
        formData.append("description", `[CLAN INTEL: ${clanName}] ${description}`);
        formData.append("clan_name", clanName);

        try {
            const result = await submitIntel(formData);
            if (result.success) {
                setMessage({ type: "success", text: "Intel relayed to High Command." });
                setDescription("");
                setFile(null);
                setPreviewUrl(null);
            } else {
                setMessage({ type: "error", text: result.error || "Failed transmission." });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Critical system error." });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#5865F2] animate-spin" />
            </div>
        );
    }

    if (!clanData) {
        return (
            <div className="min-h-screen bg-[#020617] text-white p-8 flex flex-col items-center justify-center text-center">
                <Info className="w-12 h-12 text-rose-500 mb-4" />
                <h1 className="text-2xl font-black uppercase tracking-widest mb-2">Clan Intelligence Missing</h1>
                <p className="text-gray-400 mb-8">The archive has no record of a clan named "{clanName}".</p>
                <button
                    onClick={() => router.push('/map')}
                    className="px-6 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors uppercase font-bold text-xs tracking-widest"
                >
                    Return to War Room
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-gray-200 font-sans pb-20 selection:bg-[#5865F2]/30">
            {/* Header */}
            <header className="bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-50 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.push('/map')} // Note: we should handle opening the right tab if possible
                            className="p-2 hover:bg-white/5 rounded-full transition-colors group"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white" />
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                                <Users className="w-6 h-6 text-[#5865F2]" />
                                {clanData.clan_name}
                            </h1>
                            <p className="text-[10px] text-[#5865F2] font-mono uppercase tracking-widest">
                                Global Roster Dossier // Sector-Global
                            </p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                        <div className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                                <Sword className="w-4 h-4 text-rose-500" />
                                <span className="text-xl font-black text-white">{clanData.total_activity}</span>
                            </div>
                            <div className="flex items-center gap-1.5 justify-end">
                                <p className="text-[10px] text-gray-500 uppercase tracking-tighter cursor-help" title="Total PvP appearances (kills or deaths) recorded for this clan in the last 24h.">Combat Intensity</p>
                                <Info className="w-3 h-3 text-gray-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Roster Table */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-sm font-black uppercase tracking-widest text-[#5865F2] flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Identified Operatives ({clanData.members.length})
                            </h2>
                            <span className="text-[10px] font-mono text-gray-500 uppercase">Archive Entry: {new Date(clanData.last_scanned).toLocaleDateString()}</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-black/40 text-[10px] uppercase font-black tracking-widest text-gray-500">
                                    <tr>
                                        <th className="px-6 py-4 font-black">Character Name</th>
                                        <th className="px-6 py-4 font-black text-center">Appearances</th>
                                        <th className="px-6 py-4 font-black text-right">Last Spotted</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-sans">
                                    {clanData.members.map((member) => (
                                        <tr key={member.name} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                                                    <span className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">{member.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="bg-[#5865F2]/10 text-[#5865F2] px-2 py-0.5 rounded border border-[#5865F2]/20 text-xs font-mono font-bold">
                                                    {member.count}x
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 text-[10px] text-gray-500 font-mono">
                                                    <Clock className="w-3 h-3" />
                                                    {member.lastSeen}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right: Intel Submission */}
                <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#5865F2] to-transparent opacity-30"></div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-[#5865F2] mb-6 decoration-[#5865F2]/50 underline underline-offset-4 decoration-2">
                            Add Clan Intelligence
                        </h2>

                        <form onSubmit={handleSubmitIntel} className="space-y-4">
                            {message && (
                                <div className={`p-3 rounded-lg border text-xs font-bold tracking-wide ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                                    {message.text}
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex justify-between">
                                    Tactical Evidence
                                    <span className="text-gray-700 italic font-sans">(CTRL+V)</span>
                                </label>
                                <div
                                    className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer flex items-center justify-center p-4 min-h-[120px] 
                                        ${previewUrl ? 'border-[#5865F2]/50 bg-black/50' : 'border-white/10 bg-black/40 hover:bg-black/60 hover:border-[#5865F2]/30'}`}
                                    onPaste={handlePaste}
                                    onClick={() => !file && fileInputRef.current?.click()}
                                >
                                    {previewUrl ? (
                                        <div className="relative w-full">
                                            <img src={previewUrl} alt="Preview" className="rounded-lg max-h-40 mx-auto object-contain" />
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewUrl(null); }}
                                                className="absolute -top-2 -right-2 bg-black border border-white/20 p-1.5 rounded-full hover:bg-red-500/20 hover:text-red-500 transition-colors"
                                            >
                                                <Clock className="w-3 h-3 rotate-45" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center opacity-40">
                                            <Camera className="w-6 h-6 mx-auto mb-2" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Snap or Paste</p>
                                        </div>
                                    )}
                                    <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} accept="image/*" className="hidden" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                                    Intelligence Narrative
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Enter movements, threats, or dossier updates..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-gray-300 focus:border-[#5865F2]/50 outline-none transition-all resize-none font-sans min-h-[100px]"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || (!file && !description.trim())}
                                className={`w-full py-3.5 rounded-xl font-black uppercase tracking-widest transition-all text-xs border shadow-sm flex items-center justify-center gap-2
                                    ${isSubmitting || (!file && !description.trim())
                                        ? 'bg-white/5 text-gray-600 border-white/5 cursor-not-allowed'
                                        : 'bg-[#5865F2]/90 hover:bg-[#5865F2] text-white border-[#5865F2] shadow-[0_4px_20px_rgba(88,101,242,0.3)] hover:-translate-y-0.5'}`}
                            >
                                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                {isSubmitting ? 'Relaying...' : 'Upload Intel'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-[#5865F2]/5 border border-[#5865F2]/20 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <Info className="w-4 h-4 text-[#5865F2]" />
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5865F2]">Operational Note</h3>
                        </div>
                        <p className="text-[10px] text-gray-400 font-sans italic leading-relaxed">
                            This dossier is automatically compiled from combat events recorded on the global network spanning the last 24 hours. Characters with multiple entries indicate high combat density.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
