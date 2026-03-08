"use client";

import { useEffect, useState } from "react";
import { UserProfile, fetchMyProfile, updateDisplayName, updateBio, addCharacter, deleteCharacter, toggleMain, updateCharacterRace } from "./actions";
import { useSession } from "next-auth/react";
import { Sword, Shield, Activity, Clock, Hammer, ArrowLeft, Crown, RefreshCw, Info } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
    const { status } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState("");
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [newBio, setNewBio] = useState("");

    const [newCharName, setNewCharName] = useState("");
    const [newCharIsVisible, setNewCharIsVisible] = useState(true);
    const [newCharAdminOnly, setNewCharAdminOnly] = useState(false);

    const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadProfile = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchMyProfile();
            setProfile(data);
            if (data) {
                setNewName(data.display_name || "");
                setNewBio(data.bio || "");
            }
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to establish connection to identity mainframe.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            loadProfile();
        }
    }, [status]);

    if (status === "loading" || isLoading) {
        return <div className="min-h-screen bg-[#0e0c10] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-red-800 border-t-[#c5a059] animate-spin"></div></div>;
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-[#0e0c10] flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-red-950/20 border border-red-900/50 p-8 rounded-2xl max-w-md space-y-4 shadow-2xl">
                    <h1 className="text-2xl font-heading font-black text-red-600 uppercase tracking-widest">Codex Access Restricted</h1>
                    <p className="text-stone-400 font-serif italic text-sm">{error || "The requested soul registry record could not be found."}</p>
                    <div className="pt-4">
                        <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#c5a059] hover:text-white transition-colors">
                            <ArrowLeft className="w-3 h-3" /> Back to Terminal
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const handleSaveName = async () => {
        await updateDisplayName(newName);
        setProfile({ ...profile, display_name: newName });
        setIsEditingName(false);
    };

    const handleSaveBio = async () => {
        await updateBio(newBio);
        setProfile({ ...profile, bio: newBio });
        setIsEditingBio(false);
    };

    const handleAddAlt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCharName.trim()) return;
        await addCharacter(newCharName, newCharIsVisible, newCharAdminOnly);
        setNewCharName("");
        setNewCharIsVisible(true);
        setNewCharAdminOnly(false);
        await loadProfile();
    };

    const handleUpdateRace = async (charId: string, race: string) => {
        await updateCharacterRace(charId, race);
        if (profile) {
            setProfile({
                ...profile,
                Characters: profile.Characters.map(c => c.id === charId ? { ...c, race } : c)
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Ostracize this character from the roster?")) return;
        await deleteCharacter(id);
        setProfile({
            ...profile,
            Characters: profile.Characters.filter(c => c.id !== id)
        });
    };

    const handleSetMain = async (id: string) => {
        await toggleMain(id);
        await loadProfile();
    };

    return (
        <div className="min-h-screen bg-transparent text-gray-300 p-4 sm:p-8 font-sans selection:bg-red-900/50">
            <div className="max-w-5xl mx-auto space-y-8 relative z-10">

                <header className="border-b border-red-900/30 pb-6 flex items-center gap-6">
                    <Link
                        href="/"
                        className="p-2.5 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-social-cobalt-border group"
                        title="Back to Command"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-red-500" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-4xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-[#c5a059] tracking-wider drop-shadow-sm uppercase">
                            Dreadkrew Dossier
                        </h1>
                        <div className="flex items-start gap-2 mt-2 max-w-2xl bg-red-950/20 p-3 rounded-lg border border-red-900/40">
                            <Info className="w-5 h-5 text-[#c5a059] shrink-0 mt-0.5" />
                            <p className="text-gray-400 font-serif italic text-sm leading-relaxed">
                                This page is visible only to you and an admin. Your <span className="text-[#c5a059] font-bold">Declared Main</span> character will be public facing, along with your <span className="text-gray-200">Display Name</span> and Personal Lore.
                            </p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Identity Card */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-surface border border-red-900/30 rounded-card p-6 backdrop-blur-[--blur-glass] shadow-[0_4px_20px_rgba(0,0,0,0.5)] relative overflow-hidden group transition-all hover:border-red-900/50">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-950/20 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>

                            <h2 className="text-xs font-bold uppercase tracking-widest text-[#c5a059] mb-4 font-heading border-b border-red-900/20 pb-2">Primary Identity</h2>

                            <div className="mb-6 relative z-10">
                                <label className="block text-[10px] text-gray-500 mb-1 font-bold tracking-widest uppercase">Display Name</label>
                                {isEditingName ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={e => setNewName(e.target.value)}
                                            className="w-full bg-black border border-red-900/40 rounded px-3 py-1.5 text-white text-sm focus:border-red-500 outline-none"
                                        />
                                        <button onClick={handleSaveName} className="bg-red-900/40 border border-red-500 px-3 py-1.5 rounded text-white text-xs font-bold">Set</button>
                                        <button onClick={() => setIsEditingName(false)} className="bg-stone-900 px-3 py-1.5 rounded text-gray-400 text-xs font-bold">X</button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-red-900/20 shadow-inner group/name relative">
                                        <span className="text-xl font-heading font-black text-gray-100">{profile.display_name || "Unknown Operative"}</span>
                                        <button onClick={() => setIsEditingName(true)} className="text-red-500 hover:text-red-400 text-[10px] font-black tracking-widest opacity-0 group-hover/name:opacity-100 transition-all border border-red-900/40 px-2 py-1 rounded bg-black">EDIT</button>
                                    </div>
                                )}
                            </div>

                            <div className="mb-6 relative z-10">
                                <label className="block text-[10px] text-gray-500 mb-1 font-bold tracking-widest uppercase">Personal Lore</label>
                                {isEditingBio ? (
                                    <div className="flex flex-col gap-2">
                                        <textarea
                                            value={newBio}
                                            onChange={e => setNewBio(e.target.value)}
                                            className="w-full bg-black border border-red-900/40 rounded px-3 py-2 text-gray-300 text-sm focus:border-red-500 outline-none min-h-[100px] font-serif italic"
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setIsEditingBio(false)} className="bg-stone-900 px-3 py-1.5 rounded text-gray-400 text-xs font-bold">Cancel</button>
                                            <button onClick={handleSaveBio} className="bg-red-900/40 border border-red-500 px-3 py-1.5 rounded text-white text-xs font-bold">Inscribe</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="group/bio bg-black/40 p-3 rounded-lg border border-red-900/20 shadow-inner relative min-h-[80px]">
                                        <button onClick={() => setIsEditingBio(true)} className="absolute top-2 right-2 text-red-500 hover:text-red-400 text-[10px] font-black tracking-widest opacity-0 group-hover/bio:opacity-100 transition-all border border-red-900/40 px-2 py-1 rounded bg-black">EDIT</button>
                                        <p className="text-sm text-stone-400 font-serif italic whitespace-pre-wrap leading-relaxed pr-8">
                                            {profile.bio || "No lore inscribed yet."}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 pt-4 border-t border-red-900/20">
                                <div className="flex items-center justify-between">
                                    <label className="block text-[10px] text-gray-500 font-bold tracking-widest uppercase">Rank</label>
                                    <div className={`px-3 py-1 text-xs font-black uppercase tracking-widest rounded border ${profile.role === 'Admin' ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/20 shadow-[0_0_15px_rgba(197,160,89,0.2)]' : 'bg-red-950/20 border-red-900/40 text-gray-400'}`}>
                                        {profile.role}
                                    </div>
                                </div>
                                <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg text-center">
                                    <p className="text-[10px] text-red-900 font-serif italic font-bold">
                                        "Only clan command view these records."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Characters */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-surface border border-red-900/30 rounded-xl p-6 backdrop-blur-[--blur-glass] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                            <div className="flex items-center justify-between mb-6 pb-2 border-b border-red-900/20">
                                <h2 className="text-xs font-bold uppercase tracking-widest text-[#c5a059] font-heading">Declared Characters</h2>
                                <span className="text-[10px] font-mono text-stone-600 uppercase tracking-widest">{profile.Characters.length} Files Found</span>
                            </div>

                            <div className="space-y-3 mb-8">
                                {profile.Characters.length === 0 ? (
                                    <div className="border border-dashed border-red-900/20 rounded-xl p-8 text-center bg-black/10">
                                        <p className="text-stone-600 italic text-sm">No identity connections established.</p>
                                    </div>
                                ) : (
                                    profile.Characters
                                        .sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0))
                                        .map(char => (
                                            <div
                                                key={char.id}
                                                onClick={() => setSelectedCharId(char.id)}
                                                className={`flex flex-col lg:flex-row items-center justify-between bg-black/40 border cursor-pointer ${selectedCharId === char.id ? 'border-[#c5a059] ring-1 ring-[#c5a059]/30 bg-[#c5a059]/5' : char.is_main ? 'border-[#c5a059]/30 bg-[#c5a059]/5 shadow-[0_0_20px_rgba(197,160,89,0.1)]' : 'border-red-900/20'} rounded-lg p-4 hover:border-red-900/50 transition-all group relative overflow-hidden`}
                                            >
                                                <div className="flex items-center gap-4 relative z-10 flex-1">
                                                    <div className={`w-12 h-12 rounded flex items-center justify-center border ${char.is_main ? 'bg-[#c5a059]/10 border-[#c5a059]/40 text-[#c5a059]' : 'bg-red-950/40 border-red-900/40 text-red-700'}`}>
                                                        {char.is_main ? <Crown className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className={`text-lg font-black tracking-wider uppercase ${char.is_main ? 'text-[#c5a059]' : 'text-gray-200'}`}>{char.name}</h3>
                                                            {char.is_main && <span className="text-[9px] bg-[#c5a059] text-black px-2 py-0.5 rounded font-black tracking-tighter">MAIN</span>}
                                                        </div>
                                                        <div className="flex gap-2 mt-1">
                                                            <select
                                                                value={char.race || ""}
                                                                onChange={(e) => handleUpdateRace(char.id, e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="text-[9px] uppercase tracking-widest font-black bg-black border border-red-900/40 text-[#c5a059]/70 px-2 py-0.5 rounded outline-none focus:border-[#c5a059] transition-colors"
                                                            >
                                                                <option value="" disabled>Race Select</option>
                                                                {['Alfar', 'Mahirim', 'Mirdain', 'Ork', 'Dwarf', 'Human'].map(r => (
                                                                    <option key={r} value={r} className="bg-stone-900">{r}</option>
                                                                ))}
                                                            </select>
                                                            {char.admin_only && <span className="text-[9px] font-black uppercase text-red-500 bg-red-500/10 border border-red-950 px-2 py-0.5 rounded">Shadow Alt</span>}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="hidden lg:grid grid-cols-4 gap-6 px-6 relative z-10 border-l border-red-900/20 ml-6">
                                                    <div className="text-center">
                                                        <Sword className="w-3 h-3 text-red-500 mb-1 mx-auto opacity-40" />
                                                        <p className="text-[10px] font-mono font-bold text-gray-500">
                                                            {char.last_gank_given ? new Date(char.last_gank_given).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '--'}
                                                        </p>
                                                    </div>
                                                    <div className="text-center">
                                                        <Shield className="w-3 h-3 text-blue-500 mb-1 mx-auto opacity-40" />
                                                        <p className="text-[10px] font-mono font-bold text-gray-500">
                                                            {char.last_gank_received ? new Date(char.last_gank_received).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '--'}
                                                        </p>
                                                    </div>
                                                    <div className="text-center">
                                                        <Activity className="w-3 h-3 text-[rgb(197,160,89)] mb-1 mx-auto opacity-40" />
                                                        <p className="text-[10px] font-mono font-bold text-gray-500">
                                                            {char.last_online ? new Date(char.last_online).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '--'}
                                                        </p>
                                                    </div>
                                                    <div className="text-center">
                                                        <Hammer className="w-3 h-3 text-emerald-500 mb-1 mx-auto opacity-40" />
                                                        <p className="text-[10px] font-mono font-bold text-gray-500">
                                                            {char.last_harvest ? new Date(char.last_harvest).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '--'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 relative z-10 ml-4">
                                                    {!char.is_main && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleSetMain(char.id); }}
                                                            className="opacity-0 group-hover:opacity-100 bg-[#c5a059]/10 hover:bg-[#c5a059]/20 text-[#c5a059] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded border border-[#c5a059]/30 transition-all"
                                                        >
                                                            Set Main
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(char.id); }}
                                                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-600 p-2 transition-colors"
                                                    >
                                                        <Sword className="w-4 h-4 rotate-45" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>

                            <form onSubmit={handleAddAlt} className="bg-black/60 border border-red-900/30 rounded-xl p-5">
                                <h3 className="text-[10px] uppercase font-black tracking-widest text-[#c5a059] mb-4 flex items-center gap-2">
                                    <span className="text-red-600 text-lg">+</span> Initiate Alt Operative
                                </h3>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        required
                                        value={newCharName}
                                        onChange={e => setNewCharName(e.target.value)}
                                        placeholder="Identification Name"
                                        className="w-full bg-[#0a0a0a] border border-red-900/40 rounded px-4 py-2 text-sm text-gray-300 outline-none focus:border-red-600 transition-colors"
                                    />
                                    <div className="flex items-center gap-6 bg-red-950/10 p-3 rounded border border-red-900/20">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input type="checkbox" checked={newCharIsVisible} onChange={e => setNewCharIsVisible(e.target.checked)} className="accent-red-600" />
                                            <span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-gray-300 transition-colors">Visible</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input type="checkbox" checked={newCharAdminOnly} onChange={e => setNewCharAdminOnly(e.target.checked)} className="accent-red-600" />
                                            <span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-red-800 transition-colors">Shadow Asset</span>
                                        </label>
                                    </div>
                                    <button type="submit" className="w-full py-3 bg-red-900/30 hover:bg-red-900/50 border border-red-900/50 text-[#c5a059] text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-lg shadow-lg">
                                        Inscribe Operative
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Intelligence Interface */}
                        <div className="mt-8 bg-black/40 border border-red-900/30 rounded-xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-950/10 rounded-full blur-3xl group-hover:bg-red-950/20 transition-all pointer-events-none"></div>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-red-950/30 border border-red-900/40 flex items-center justify-center">
                                        <RefreshCw className={`w-5 h-5 text-[#c5a059] ${isRefreshing ? 'animate-spin' : ''}`} />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#c5a059]">Tactical Uplink</h4>
                                        <p className="text-[10px] text-gray-500 font-serif italic mt-0.5">
                                            {selectedCharId ? `Ready to pulse data for ${profile.Characters.find(c => c.id === selectedCharId)?.name}.` : "Select an operative above to establish a link."}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    disabled={!selectedCharId || isRefreshing}
                                    onClick={() => { setIsRefreshing(true); setTimeout(() => setIsRefreshing(false), 2000); }}
                                    className={`px-8 py-3 rounded text-[10px] font-black uppercase tracking-widest border transition-all ${selectedCharId && !isRefreshing ? 'bg-red-900/30 border-red-600 text-white hover:bg-red-800/40' : 'bg-stone-900 border-stone-800 text-stone-600 cursor-not-allowed'}`}
                                >
                                    {isRefreshing ? "SYNCING..." : "Pulse Intelligence"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
