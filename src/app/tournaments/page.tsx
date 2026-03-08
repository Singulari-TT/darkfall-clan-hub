"use client";
import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
    fetchTournaments,
    createTournament,
    Tournament,
} from "./actions";
import { ArrowLeft } from "lucide-react";

const FORMAT_OPTIONS = ["Free For All", "1v1", "Team"];

const statusStyle: Record<string, string> = {
    Open: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "In Progress": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Ended: "bg-white/10 text-gray-400 border-white/20",
};

const formatStyle: Record<string, string> = {
    "Free For All": "bg-purple-500/20 text-purple-300 border-purple-500/30",
    "1v1": "bg-blue-500/20 text-blue-300 border-blue-500/30",
    Team: "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

export default function TournamentsPage() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [form, setForm] = useState({
        name: "",
        description: "",
        format: "Free For All",
        prize: "",
        starts_at: "",
    });

    const loadTournaments = () => {
        setIsLoading(true);
        fetchTournaments()
            .then(setTournaments)
            .catch((e) => setError(e.message))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => { loadTournaments(); }, []);

    const handleCreate = () => {
        if (!form.name.trim()) return;
        setError(null);
        startTransition(async () => {
            try {
                await createTournament(
                    form.name.trim(),
                    form.description.trim(),
                    form.format,
                    form.prize.trim(),
                    form.starts_at
                );
                setForm({ name: "", description: "", format: "Free For All", prize: "", starts_at: "" });
                setShowCreate(false);
                loadTournaments();
            } catch (e: any) {
                setError(e.message);
            }
        });
    };

    const grouped = {
        Open: tournaments.filter((t) => t.status === "Open"),
        "In Progress": tournaments.filter((t) => t.status === "In Progress"),
        Ended: tournaments.filter((t) => t.status === "Ended"),
    };

    const TournamentCard = ({ t }: { t: Tournament }) => (
        <Link
            href={`/tournaments/${t.id}`}
            className="group relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/8 hover:border-amber-500/30 hover:shadow-[0_0_25px_rgba(245,158,11,0.08)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3"
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all -mr-8 -mt-8 pointer-events-none" />

            {/* Title row */}
            <div className="flex items-start justify-between gap-3 z-10">
                <h3 className="font-bold text-white text-lg leading-tight group-hover:text-amber-300 transition-colors">
                    {t.name}
                </h3>
                <span className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${statusStyle[t.status] || ""}`}>
                    {t.status}
                </span>
            </div>

            {/* Description */}
            {t.description && (
                <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 z-10">{t.description}</p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2 mt-auto z-10">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${formatStyle[t.format] || ""}`}>
                    {t.format}
                </span>
                {t.prize && (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border bg-amber-500/10 text-amber-400 border-amber-500/20">
                        🏆 {t.prize}
                    </span>
                )}
                <span className="ml-auto text-xs text-gray-500 font-mono">
                    👥 {t.participant_count ?? 0}
                </span>
                {t.starts_at && (
                    <span className="text-[11px] text-gray-500">
                        🗓 {new Date(t.starts_at).toLocaleDateString()}
                    </span>
                )}
            </div>

            {/* Creator */}
            <div className="text-[11px] text-gray-600 z-10">
                Created by <span className="text-gray-400">{t.creator_name}</span>
            </div>
        </Link>
    );

    return (
        <div className="min-h-screen bg-transparent text-gray-300 p-4 sm:p-8 font-sans selection:bg-amber-500/20">
            <div className="max-w-6xl mx-auto space-y-8 relative z-10">

                {/* Header */}
                <header className="border-b border-white/10 pb-6 flex items-end justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-6 text-left">
                        <Link
                            href="/"
                            className="p-2.5 translate-y-2 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10 group"
                            title="Back to Command"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-amber-500" />
                        </Link>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black font-heading text-white tracking-widest mb-2 drop-shadow-md">
                                Clan <span className="text-amber-400">Tournaments</span>
                            </h1>
                            <p className="text-gray-400 text-lg">
                                Organise intra-clan competitions. Any operative can create and run a tournament.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 hover:border-amber-500/60 text-amber-400 hover:text-amber-300 font-bold text-sm transition-all shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]"
                    >
                        <span className="text-lg">⚔️</span> Create Tournament
                    </button>
                </header>

                {/* Create Modal */}
                {showCreate && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-[#0D1117] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">New Tournament</h2>
                                <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white transition-colors text-2xl leading-none">&times;</button>
                            </div>

                            {error && <p className="text-red-400 text-sm bg-red-950/40 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

                            <div className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Tournament Name *</label>
                                    <input
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500/50 transition-colors placeholder-gray-600 font-sans"
                                        placeholder="e.g. Season 1 PvP League"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    />
                                </div>

                                {/* Format */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Format</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {FORMAT_OPTIONS.map((f) => (
                                            <button
                                                key={f}
                                                onClick={() => setForm({ ...form, format: f })}
                                                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${form.format === f
                                                    ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                                                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                                                    }`}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Description</label>
                                    <textarea
                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500/50 transition-colors placeholder-gray-600 resize-none font-sans"
                                        rows={3}
                                        placeholder="Rules, matchup format, notes..."
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    />
                                </div>

                                {/* Prize & Date row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-amber-500/70 mb-1.5">Prize</label>
                                        <input
                                            className="w-full bg-black/50 border border-amber-500/20 rounded-lg px-3 py-2 text-amber-400 outline-none focus:border-amber-500/60 placeholder-amber-900 font-sans text-sm"
                                            placeholder="e.g. 500k gold"
                                            value={form.prize}
                                            onChange={(e) => setForm({ ...form, prize: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Start Date</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500/50 font-sans text-sm"
                                            value={form.starts_at}
                                            onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleCreate}
                                    disabled={isPending || !form.name.trim()}
                                    className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 hover:text-amber-200 font-bold py-2.5 rounded-xl transition-all disabled:opacity-40"
                                >
                                    {isPending ? "Creating..." : "Create Tournament"}
                                </button>
                                <button
                                    onClick={() => { setShowCreate(false); setError(null); }}
                                    className="px-5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white font-bold py-2.5 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !showCreate && (
                    <p className="text-red-400 bg-red-950/30 border border-red-500/20 rounded-xl px-4 py-3 text-sm">{error}</p>
                )}

                {/* Loading skeleton */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : tournaments.length === 0 ? (
                    <div className="text-center py-24 text-gray-600">
                        <div className="text-6xl mb-4">⚔️</div>
                        <p className="font-bold text-lg text-gray-500">No tournaments yet.</p>
                        <p className="text-sm mt-1">Click <span className="text-amber-400 font-bold">Create Tournament</span> to start the first one.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {(["Open", "In Progress", "Ended"] as const).map((status) =>
                            grouped[status].length > 0 ? (
                                <section key={status}>
                                    <h2 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${status === "Open" ? "text-emerald-400" : status === "In Progress" ? "text-amber-400" : "text-gray-500"}`}>
                                        <span className={`inline-block w-2 h-2 rounded-full ${status === "Open" ? "bg-emerald-400 animate-pulse" : status === "In Progress" ? "bg-amber-400 animate-pulse" : "bg-gray-600"}`} />
                                        {status} <span className="opacity-50 font-normal">({grouped[status].length})</span>
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {grouped[status].map((t) => <TournamentCard key={t.id} t={t} />)}
                                    </div>
                                </section>
                            ) : null
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
