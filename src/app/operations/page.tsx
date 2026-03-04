"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { fetchOperations, createOperation, fetchRSVPs, submitRSVP, ClanOperation, RSVP } from "./actions";

export default function OperationsPage() {
    const { data: session, status } = useSession();

    const [operations, setOperations] = useState<ClanOperation[]>([]);
    const [rsvps, setRsvps] = useState<Record<string, RSVP[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    // @ts-ignore
    const userRole = session?.user?.role;
    const isCommand = ['Admin', 'Leader', 'Officer'].includes(userRole);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dateStr, setDateStr] = useState("");
    const [opType, setOpType] = useState("Siege");
    const [isCreating, setIsCreating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (status === "loading") return;
        loadData();
    }, [status]);

    const loadData = async () => {
        setIsLoading(true);
        const ops = await fetchOperations();
        setOperations(ops);

        const rsvpMap: Record<string, RSVP[]> = {};
        for (const op of ops) {
            const data = await fetchRSVPs(op.id);
            rsvpMap[op.id] = data;
        }
        setRsvps(rsvpMap);
        setIsLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setMessage(null);
        try {
            await createOperation(title, description, dateStr, opType);
            setMessage({ type: 'success', text: "Operation scheduled and pushed to Discord!" });
            setTitle("");
            setDescription("");
            setDateStr("");
            await loadData();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setIsCreating(false);
        }
    };

    const handleRSVP = async (opId: string, rStatus: 'Attending' | 'Maybe' | 'Absent') => {
        try {
            await submitRSVP(opId, rStatus);
            await loadData(); // Reload to get updated counts
        } catch (err) {
            console.error(err);
        }
    };

    if (isLoading || status === "loading") {
        return <div className="min-h-screen flex items-center justify-center text-[#c5a059] font-heading text-xl uppercase tracking-widest">Decrypting War Room Feeds...</div>;
    }

    return (
        <div className="min-h-screen bg-transparent p-4 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-12 relative z-10">

                <header className="border-b border-red-900/40 pb-6">
                    <h1 className="text-4xl md:text-5xl font-heading font-black bg-gradient-to-r from-red-600 to-[#c5a059] text-transparent bg-clip-text uppercase tracking-wider mb-2 drop-shadow-sm">
                        Operations Command
                    </h1>
                    <p className="text-gray-400 font-serif italic text-lg shadow-black">Coordinate sieges, logistics raids, and clan-wide events.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* Left Column: Create Op (Admins Only) */}
                    <div className="lg:col-span-1 space-y-6">
                        {isCommand && (
                            <div className="bg-[#1a151b] border border-red-900/40 rounded-xl p-6 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#c5a059] to-transparent opacity-50"></div>
                                <h2 className="text-xl font-heading font-bold text-[#c5a059] mb-4 uppercase tracking-widest border-b border-red-900/30 pb-2">Schedule Operation</h2>

                                {message && (
                                    <div className={`p-3 text-sm mb-4 rounded border font-bold ${message.type === 'success' ? 'bg-emerald-900/20 text-emerald-500 border-emerald-900/50' : 'bg-red-900/20 text-red-500 border-red-900/50'}`}>
                                        {message.text}
                                    </div>
                                )}

                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div>
                                        <label className="block text-xs uppercase text-gray-400 font-bold mb-1">Op Name / Objective</label>
                                        <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-[#0e0c10] border border-red-900/50 rounded p-2 text-gray-200 outline-none focus:border-[#c5a059] font-heading font-bold" placeholder="e.g., Siege of Cairn..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-gray-400 font-bold mb-1">Type</label>
                                        <select value={opType} onChange={e => setOpType(e.target.value)} className="w-full bg-[#0e0c10] border border-red-900/50 rounded p-2 text-[#c5a059] outline-none">
                                            <option>Siege</option>
                                            <option>PvE Farm</option>
                                            <option>Roaming Patrol</option>
                                            <option>Town Hall Meeting</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-gray-400 font-bold mb-1">Date & Time</label>
                                        <input type="datetime-local" required value={dateStr} onChange={e => setDateStr(e.target.value)} className="w-full bg-[#0e0c10] border border-red-900/50 rounded p-2 text-gray-300 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase text-gray-400 font-bold mb-1">Briefing</label>
                                        <textarea required rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-[#0e0c10] border border-red-900/50 rounded p-2 text-gray-300 outline-none font-serif text-sm" placeholder="Details regarding assembly point, loadouts..."></textarea>
                                    </div>
                                    <button type="submit" disabled={isCreating} className="w-full bg-red-900/80 hover:bg-red-700 text-white font-heading font-black uppercase tracking-widest py-2 rounded transition-all shadow-[0_0_15px_rgba(255,0,0,0.2)]">
                                        {isCreating ? "Broadcasting..." : "Issue Command & Ping Discord"}
                                    </button>
                                </form>
                            </div>
                        )}
                        {!isCommand && (
                            <div className="bg-[#1a151b]/40 border border-stone-800 rounded-xl p-6 text-center text-stone-500 font-serif italic">
                                Only Command Staff can schedule official operations. Await orders.
                            </div>
                        )}
                    </div>

                    {/* Right Column: Upcoming Ops */}
                    <div className="lg:col-span-2 space-y-6">
                        {operations.length === 0 ? (
                            <div className="bg-black/40 border border-stone-800/50 rounded-xl p-12 text-center">
                                <span className="text-4xl opacity-50">📡</span>
                                <h3 className="text-gray-400 font-heading tracking-widest uppercase mt-4">Static on the Wire</h3>
                                <p className="text-stone-600 font-serif italic text-sm mt-2">There are no upcoming operations scheduled.</p>
                            </div>
                        ) : (
                            operations.map(op => {
                                const opRsvps = rsvps[op.id] || [];
                                const attending = opRsvps.filter(r => r.status === 'Attending').length;
                                const maybe = opRsvps.filter(r => r.status === 'Maybe').length;
                                // @ts-ignore
                                const myRsvp = opRsvps.find(r => r.Users?.display_name === session?.user?.name)?.status;

                                return (
                                    <div key={op.id} className="bg-[#1a151b] border-2 border-red-900/30 rounded-xl shadow-lg relative overflow-hidden group hover:border-[#c5a059]/50 transition-all">

                                        {/* Status Header */}
                                        <div className={`p-4 flex justify-between items-center bg-black/50 border-b border-red-900/20`}>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded ${op.op_type === 'Siege' ? 'bg-red-900/50 text-red-400 border border-red-900' : 'bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/50'}`}>
                                                    {op.op_type}
                                                </span>
                                                <h3 className="text-lg font-heading font-bold text-gray-200">{op.title}</h3>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-[#c5a059] font-mono">{new Date(op.event_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Scheduled by {op.Users?.display_name}</p>
                                            </div>
                                        </div>

                                        {/* Briefing */}
                                        <div className="p-6">
                                            <p className="text-gray-300 font-serif italic whitespace-pre-wrap">{op.description}</p>
                                        </div>

                                        {/* RSVP Controls & Stats */}
                                        <div className="p-4 bg-black/80 flex flex-col md:flex-row justify-between items-center gap-4">
                                            <div className="flex gap-4 items-center">
                                                <div className="text-center px-4 border-r border-stone-800">
                                                    <span className="block text-[#c5a059] font-black text-xl">{attending}</span>
                                                    <span className="text-[10px] uppercase text-stone-500 tracking-widest">Attending</span>
                                                </div>
                                                <div className="text-center px-2">
                                                    <span className="block text-gray-400 font-black text-xl">{maybe}</span>
                                                    <span className="text-[10px] uppercase text-stone-500 tracking-widest">Maybe</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button onClick={() => handleRSVP(op.id, 'Attending')} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all ${myRsvp === 'Attending' ? 'bg-emerald-900 border border-emerald-500 text-emerald-200' : 'bg-stone-900 border border-stone-700 text-stone-400 hover:text-white hover:border-emerald-500'}`}>
                                                    Attending
                                                </button>
                                                <button onClick={() => handleRSVP(op.id, 'Maybe')} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all ${myRsvp === 'Maybe' ? 'bg-[#c5a059]/30 border border-[#c5a059] text-[#c5a059]' : 'bg-stone-900 border border-stone-700 text-stone-400 hover:text-white hover:border-[#c5a059]'}`}>
                                                    Maybe
                                                </button>
                                                <button onClick={() => handleRSVP(op.id, 'Absent')} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all ${myRsvp === 'Absent' ? 'bg-red-900/50 border border-red-500 text-red-300' : 'bg-stone-900 border border-stone-700 text-stone-400 hover:text-white hover:border-red-500'}`}>
                                                    Absent
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
