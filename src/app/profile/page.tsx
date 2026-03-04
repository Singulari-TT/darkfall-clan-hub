"use client";

import { useEffect, useState } from "react";
import { UserProfile, fetchMyProfile, updateDisplayName, updateBio, addCharacter, deleteCharacter } from "./actions";
import { useSession } from "next-auth/react";

export default function ProfilePage() {
    const { status } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Forms
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState("");

    const [isEditingBio, setIsEditingBio] = useState(false);
    const [newBio, setNewBio] = useState("");

    const [newCharName, setNewCharName] = useState("");
    const [newCharIsVisible, setNewCharIsVisible] = useState(true);
    const [newCharAdminOnly, setNewCharAdminOnly] = useState(false);

    const loadProfile = async () => {
        setIsLoading(true);
        try {
            const data = await fetchMyProfile();
            setProfile(data);
            setNewName(data.display_name || "");
            setNewBio(data.bio || "");
        } catch (e) {
            console.error(e);
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

    if (!profile) {
        return <div className="min-h-screen bg-[#0e0c10] text-center pt-24 text-red-500 font-heading">Error loading identity codex.</div>;
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
        await loadProfile(); // Reload to get IDs
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Ostracize this character from the roster?")) return;
        await deleteCharacter(id);
        setProfile({
            ...profile,
            Characters: profile.Characters.filter(c => c.id !== id)
        });
    };

    return (
        <div className="min-h-screen bg-transparent text-gray-300 p-4 sm:p-8 font-sans selection:bg-red-900/50">
            <div className="max-w-5xl mx-auto space-y-8 relative z-10">

                <header className="border-b border-red-900/30 pb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-[#c5a059] tracking-wider drop-shadow-sm uppercase">
                            Dreadkrew Dossier
                        </h1>
                        <p className="text-gray-400 mt-2 font-serif italic">Manage your clan identity, biographical lore, and declare your loyal characters.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Left Column: Identity Card */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-[#1a151b]/80 border border-red-900/30 rounded-xl p-6 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-900/10 rounded-full blur-3xl group-hover:bg-red-700/20 transition-colors -mr-10 -mt-10 pointer-events-none"></div>

                            <h2 className="text-xs font-bold uppercase tracking-widest text-[#c5a059] mb-4 font-heading border-b border-red-900/30 pb-2">Primary Identity</h2>

                            {/* Display Name */}
                            <div className="mb-6 relative z-10">
                                <label className="block text-[10px] text-gray-500 mb-1 font-bold tracking-widest uppercase">Declared Moniker</label>
                                {isEditingName ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={e => setNewName(e.target.value)}
                                            className="w-full bg-black border border-red-900/50 rounded px-3 py-1.5 text-white text-sm focus:border-red-500 outline-none"
                                            placeholder="Set a display name"
                                        />
                                        <button onClick={handleSaveName} className="bg-red-900/80 hover:bg-red-700 border border-red-800 px-3 py-1.5 rounded text-white text-xs font-bold transition-colors">Set</button>
                                        <button onClick={() => setIsEditingName(false)} className="bg-stone-900 hover:bg-stone-800 px-3 py-1.5 rounded text-gray-400 hover:text-white text-xs font-bold transition-colors">X</button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-red-900/20 shadow-inner group/name">
                                        <span className="text-xl font-heading font-black text-gray-100">{profile.display_name || <span className="text-gray-600 italic text-sm font-sans">Unknown Initiated</span>}</span>
                                        <button onClick={() => setIsEditingName(true)} className="text-red-900 hover:text-red-500 text-xs font-bold tracking-wider opacity-0 group-hover/name:opacity-100 transition-all border border-red-900/30 px-2 py-1 rounded bg-black">EDIT</button>
                                    </div>
                                )}
                            </div>

                            {/* Biography */}
                            <div className="mb-6 relative z-10">
                                <label className="block text-[10px] text-gray-500 mb-1 font-bold tracking-widest uppercase">Personal Lore</label>
                                {isEditingBio ? (
                                    <div className="flex flex-col gap-2">
                                        <textarea
                                            value={newBio}
                                            onChange={e => setNewBio(e.target.value)}
                                            className="w-full bg-black border border-red-900/50 rounded px-3 py-2 text-gray-300 text-sm focus:border-red-500 outline-none min-h-[100px] resize-y font-serif italic"
                                            placeholder="Pen your history..."
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setIsEditingBio(false)} className="bg-stone-900 hover:bg-stone-800 px-3 py-1.5 rounded text-gray-400 hover:text-white text-xs font-bold transition-colors">Cancel</button>
                                            <button onClick={handleSaveBio} className="bg-red-900/80 hover:bg-red-700 border border-red-800 px-3 py-1.5 rounded text-white text-xs font-bold transition-colors">Inscribe</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="group/bio bg-black/40 p-3 rounded-lg border border-red-900/20 shadow-inner relative min-h-[80px]">
                                        <button onClick={() => setIsEditingBio(true)} className="absolute top-2 right-2 text-red-900 hover:text-red-500 text-xs font-bold tracking-wider opacity-0 group-hover/bio:opacity-100 transition-all border border-red-900/30 px-2 py-1 rounded bg-black z-20">EDIT</button>
                                        <p className="text-sm text-stone-400 font-serif italic whitespace-pre-wrap leading-relaxed pr-10">
                                            {profile.bio || "No lore inscribed yet."}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 pt-4 border-t border-red-900/30">
                                <div>
                                    <label className="block text-[10px] text-gray-500 mb-1 font-bold tracking-widest uppercase">Discord Registry ID</label>
                                    <div className="bg-black/40 p-2 rounded border border-red-900/20 text-xs text-stone-500 font-mono">
                                        {profile.discord_id}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="block text-[10px] text-gray-500 font-bold tracking-widest uppercase">Rank</label>
                                    <div className={`inline-block px-3 py-1 text-xs font-bold font-heading uppercase tracking-widest rounded border ${profile.role === 'Admin' ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30 shadow-[0_0_10px_rgba(197,160,89,0.2)]' : 'bg-stone-800/50 text-stone-400 border-stone-700'}`}>
                                        {profile.role}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Alts Management */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-[#1a151b]/80 border border-red-900/30 rounded-xl p-6 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                            <div className="flex items-center justify-between mb-6 pb-2 border-b border-red-900/30">
                                <h2 className="text-xs font-bold uppercase tracking-widest text-[#c5a059] font-heading">Declared Characters</h2>
                                <span className="bg-black text-[#c5a059] text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border border-red-900/50 font-bold shadow-inner">
                                    {profile.Characters.length} Active
                                </span>
                            </div>

                            <div className="space-y-3 mb-8">
                                {profile.Characters.length === 0 ? (
                                    <div className="border border-dashed border-red-900/30 rounded-xl p-8 text-center bg-black/20">
                                        <span className="text-gray-500 text-sm font-serif italic">No characters declared yet. Recruit your main and alts below.</span>
                                    </div>
                                ) : (
                                    profile.Characters.map(char => (
                                        <div key={char.id} className="flex items-center justify-between bg-black/40 border border-red-900/20 rounded-lg p-4 hover:border-red-900/60 transition-colors group shadow-inner">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded bg-gradient-to-br from-red-950 to-black flex items-center justify-center border border-red-900/50 shadow-[inset_0_0_10px_rgba(139,0,0,0.3)]">
                                                    <span className="text-2xl drop-shadow-md">🛡️</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-200 text-lg font-heading tracking-wider">{char.name}</h3>
                                                    <div className="flex gap-2 mt-1">
                                                        {char.is_visible ? (
                                                            <span className="text-[9px] uppercase tracking-wider font-bold text-[#c5a059] border border-[#c5a059]/30 bg-[#c5a059]/5 px-1.5 py-0.5 rounded">Roster Vanguard</span>
                                                        ) : (
                                                            <span className="text-[9px] uppercase tracking-wider font-bold text-gray-500 border border-stone-800 bg-stone-900/50 px-1.5 py-0.5 rounded">Concealed</span>
                                                        )}
                                                        {char.admin_only && (
                                                            <span className="text-[9px] uppercase tracking-wider font-bold text-red-400 border border-red-900/50 bg-red-950/50 px-1.5 py-0.5 rounded shadow-[0_0_5px_rgba(139,0,0,0.5)]">Shadow Class</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(char.id)}
                                                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 hover:bg-red-950/50 p-2 rounded transition-all border border-transparent hover:border-red-900/50"
                                                title="Ostracize Character"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form onSubmit={handleAddAlt} className="bg-black/60 border border-red-900/30 rounded-xl p-5 shadow-inner">
                                <h3 className="text-xs uppercase tracking-widest font-bold text-[#c5a059] mb-4 flex items-center gap-2 font-heading">
                                    <span className="text-red-500 text-lg leading-none">+</span> Conscript Alt
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <input
                                            type="text"
                                            required
                                            value={newCharName}
                                            onChange={e => setNewCharName(e.target.value)}
                                            placeholder="Character Name (e.g. Sir Galahad)"
                                            className="w-full bg-[#0e0c10] border border-red-900/40 rounded px-4 py-2.5 text-gray-300 text-sm focus:border-red-600 outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="flex items-center gap-6 bg-[#0e0c10]/50 p-3 rounded border border-red-900/20">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={newCharIsVisible}
                                                onChange={e => setNewCharIsVisible(e.target.checked)}
                                                className="w-4 h-4 rounded border-red-900/50 text-red-600 focus:ring-red-900 focus:ring-offset-[#0e0c10] bg-black cursor-pointer"
                                            />
                                            <span className="text-xs text-gray-400 group-hover:text-gray-200 font-bold uppercase tracking-wider">Visible on Roster</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group" title="Only clan command will see this character in the directory. Used for spies.">
                                            <input
                                                type="checkbox"
                                                checked={newCharAdminOnly}
                                                onChange={e => setNewCharAdminOnly(e.target.checked)}
                                                className="w-4 h-4 rounded border-red-900/50 text-red-600 focus:ring-red-900 focus:ring-offset-[#0e0c10] bg-black cursor-pointer"
                                            />
                                            <span className="text-xs text-gray-400 group-hover:text-red-400 font-bold uppercase tracking-wider transition-colors">Classified (Shadow Alt)</span>
                                        </label>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-red-900/60 hover:bg-red-800 text-[#c5a059] hover:text-white font-bold font-heading tracking-widest uppercase text-sm py-3 rounded shadow-[0_0_15px_rgba(139,0,0,0.3)] transition-all border border-red-900/80 hover:border-red-500"
                                    >
                                        Register Character
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
