"use client";
import { useState, useEffect, useTransition, use } from "react";
import { useRouter } from "next/navigation";
import {
    fetchTournamentById,
    joinTournament,
    leaveTournament,
    updateTournamentStatus,
    deleteTournament,
    setPlacement,
    fetchMatches,
    generateBrackets,
    Tournament,
    TournamentParticipant,
    TournamentMatch,
} from "../actions";
import TournamentBracket from "../components/TournamentBracket";

const statusStyle: Record<string, string> = {
    Open: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "In Progress": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Ended: "bg-white/10 text-gray-400 border-white/20",
};

const placementIcon = (p: number | null) => {
    if (p === 1) return "🥇";
    if (p === 2) return "🥈";
    if (p === 3) return "🥉";
    if (p) return `#${p}`;
    return null;
};

export default function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
    const [matches, setMatches] = useState<TournamentMatch[]>([]);
    const [view, setView] = useState<"roster" | "bracket">("roster");
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    // Join modal
    const [showJoin, setShowJoin] = useState(false);
    const [charName, setCharName] = useState("");

    // Placement editing
    const [editingPlacement, setEditingPlacement] = useState<Record<string, string>>({});

    const load = () => {
        setIsLoading(true);
        Promise.all([
            fetchTournamentById(id),
            fetchMatches(id)
        ])
            .then(([{ tournament, participants, currentUserId }, matches]) => {
                setTournament(tournament);
                setParticipants(participants);
                setMatches(matches);
                setCurrentUserId(currentUserId);
                // Seed placement editor with current values
                const placements: Record<string, string> = {};
                participants.forEach((p) => { placements[p.id] = p.placement?.toString() ?? ""; });
                setEditingPlacement(placements);
            })
            .catch((e) => setError(e.message))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => { load(); }, [id]);

    const isRegistered = participants.some((p) => p.user_id === currentUserId);
    const isCreatorOrAdmin = tournament?.created_by === currentUserId; // server will double-check role too

    const handleJoin = () => {
        if (!charName.trim()) return;
        startTransition(async () => {
            try {
                await joinTournament(id, charName.trim());
                setShowJoin(false);
                setCharName("");
                load();
            } catch (e: any) { setError(e.message); }
        });
    };

    const handleLeave = () => {
        startTransition(async () => {
            try {
                await leaveTournament(id);
                load();
            } catch (e: any) { setError(e.message); }
        });
    };

    const handleStatus = (status: string) => {
        startTransition(async () => {
            try {
                await updateTournamentStatus(id, status);
                load();
            } catch (e: any) { setError(e.message); }
        });
    };

    const handleDelete = () => {
        if (!confirm("Delete this tournament permanently?")) return;
        startTransition(async () => {
            try {
                await deleteTournament(id);
                router.push("/tournaments");
            } catch (e: any) { setError(e.message); }
        });
    };

    const handleSavePlacement = (participantId: string) => {
        const val = editingPlacement[participantId];
        const num = val ? parseInt(val, 10) : null;
        startTransition(async () => {
            try {
                await setPlacement(participantId, isNaN(num as number) ? null : num);
                load();
            } catch (e: any) { setError(e.message); }
        });
    };

    const handleGenerateBracket = () => {
        if (!confirm("Generate tournament brackets? This will shuffle seeds.")) return;
        startTransition(async () => {
            try {
                await generateBrackets(id);
                load();
                setView("bracket");
            } catch (e: any) { setError(e.message); }
        });
    };

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!tournament) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
            <span className="text-5xl">🔍</span>
            <p>Tournament not found.</p>
        </div>
    );

    const sortedParticipants = [...participants].sort((a, b) => {
        if (a.placement && b.placement) return a.placement - b.placement;
        if (a.placement) return -1;
        if (b.placement) return 1;
        return new Date(a.registered_at).getTime() - new Date(b.registered_at).getTime();
    });

    return (
        <div className="min-h-screen bg-transparent text-gray-300 p-4 sm:p-8 font-sans selection:bg-amber-500/20">
            <div className="max-w-5xl mx-auto space-y-8 relative z-10">

                {/* Back */}
                <button
                    onClick={() => router.push("/tournaments")}
                    className="text-sm text-gray-500 hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                    ← Back to Tournaments
                </button>

                {/* Error */}
                {error && (
                    <p className="text-red-400 bg-red-950/30 border border-red-500/20 rounded-xl px-4 py-3 text-sm">
                        {error} <button className="ml-2 underline" onClick={() => setError(null)}>dismiss</button>
                    </p>
                )}

                {/* Join Modal */}
                {showJoin && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-[#0D1117] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 animate-in fade-in zoom-in duration-200">
                            <h2 className="text-xl font-bold text-white">Enter Your Character Name</h2>
                            <input
                                autoFocus
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500/50 transition-colors placeholder-gray-600 font-sans"
                                placeholder="Your in-game character name"
                                value={charName}
                                onChange={(e) => setCharName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={handleJoin}
                                    disabled={isPending || !charName.trim()}
                                    className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 font-bold py-2.5 rounded-xl transition-all disabled:opacity-40"
                                >
                                    {isPending ? "Registering..." : "Confirm Entry"}
                                </button>
                                <button
                                    onClick={() => { setShowJoin(false); setCharName(""); }}
                                    className="px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 font-bold rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left: Details */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Title Card */}
                        <div className="relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.15)]">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                            <div className="flex items-start justify-between gap-4 flex-wrap z-10 relative">
                                <div>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border mb-3 inline-block ${statusStyle[tournament.status]}`}>
                                        {tournament.status}
                                    </span>
                                    <h1 className="text-3xl font-black text-white font-heading tracking-wide mb-1">{tournament.name}</h1>
                                    <p className="text-gray-500 text-sm">Organized by <span className="text-gray-300">{tournament.creator_name}</span></p>
                                </div>
                                <div className="flex flex-col items-end gap-2 text-right">
                                    <span className="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-gray-400">
                                        Format: <strong className="text-white">{tournament.format}</strong>
                                    </span>
                                    {tournament.prize && (
                                        <span className="text-xs bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg text-amber-400">
                                            🏆 Prize: <strong>{tournament.prize}</strong>
                                        </span>
                                    )}
                                    {tournament.starts_at && (
                                        <span className="text-xs text-gray-500">
                                            🗓 {new Date(tournament.starts_at).toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {tournament.description && (
                                <div className="mt-5 pt-5 border-t border-white/10 z-10 relative">
                                    <p className="text-gray-400 leading-relaxed whitespace-pre-wrap text-sm">{tournament.description}</p>
                                </div>
                            )}
                        </div>

                        {/* Participants / Leaderboard */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                            <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-4">
                                <div className="flex items-center gap-6">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <span className="text-amber-400">👥</span>
                                        {tournament.status === "Ended" ? "Final Results" : "Competition"}
                                    </h2>
                                    <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                                        <button
                                            onClick={() => setView("roster")}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${view === 'roster' ? 'bg-amber-500/20 text-amber-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                        >
                                            Roster
                                        </button>
                                        {tournament.format !== "Free For All" && (
                                            <button
                                                onClick={() => setView("bracket")}
                                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${view === 'bracket' ? 'bg-amber-500/20 text-amber-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                            >
                                                Bracket
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <span className="text-sm font-normal text-gray-500">({participants.length})</span>
                            </div>

                            {view === "roster" ? (
                                <>
                                    {sortedParticipants.length === 0 ? (
                                        <p className="text-gray-600 italic text-center py-10">No participants yet. Be the first to sign up!</p>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {sortedParticipants.map((p, i) => {
                                                const icon = placementIcon(p.placement);
                                                const isMe = p.user_id === currentUserId;
                                                return (
                                                    <div
                                                        key={p.id}
                                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${isMe ? "bg-amber-500/10 border-amber-500/20" : "bg-black/30 border-white/5"}`}
                                                    >
                                                        {/* Rank badge */}
                                                        <div className="w-8 text-center font-bold text-lg">
                                                            {icon ?? <span className="text-gray-600 text-sm font-mono">{i + 1}</span>}
                                                        </div>

                                                        <div className="flex-1">
                                                            <p className={`font-bold text-sm ${isMe ? "text-amber-300" : "text-white"}`}>
                                                                {p.display_name}
                                                                {isMe && <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-amber-500/70">You</span>}
                                                            </p>
                                                            <p className="text-xs text-gray-500">⚔️ {p.character_name}</p>
                                                        </div>

                                                        <p className="text-xs text-gray-600 hidden sm:block">
                                                            {new Date(p.registered_at).toLocaleDateString()}
                                                        </p>

                                                        {/* Placement editor for creator/admin after tournament ends */}
                                                        {isCreatorOrAdmin && tournament.status === "Ended" && (
                                                            <div className="flex items-center gap-1.5">
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    className="w-12 bg-black/50 border border-white/10 rounded-lg px-1.5 py-1 text-white text-xs outline-none focus:border-amber-500/50 text-center"
                                                                    value={editingPlacement[p.id] ?? ""}
                                                                    onChange={(e) => setEditingPlacement((prev) => ({ ...prev, [p.id]: e.target.value }))}
                                                                    placeholder="#"
                                                                />
                                                                <button
                                                                    onClick={() => handleSavePlacement(p.id)}
                                                                    disabled={isPending}
                                                                    className="text-[10px] px-2 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-all"
                                                                >
                                                                    Set
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <TournamentBracket
                                    matches={matches}
                                    isCreator={isCreatorOrAdmin}
                                    onRefresh={load}
                                />
                            )}
                        </div>
                    </div>

                    {/* Right: Actions Panel */}
                    <div className="space-y-4">

                        {/* Join / Leave */}
                        {tournament.status === "Open" && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl space-y-3">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Registration</h3>
                                {isRegistered ? (
                                    <button
                                        onClick={handleLeave}
                                        disabled={isPending}
                                        className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-bold text-sm transition-all disabled:opacity-40"
                                    >
                                        {isPending ? "..." : "Leave Tournament"}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setShowJoin(true)}
                                        disabled={isPending}
                                        className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 font-bold text-sm transition-all disabled:opacity-40 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                                    >
                                        ⚔️ Join Tournament
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Creator / Admin Controls */}
                        {isCreatorOrAdmin && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl space-y-3">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Management</h3>

                                {tournament.status === "Open" && (
                                    <button
                                        onClick={() => handleStatus("In Progress")}
                                        disabled={isPending}
                                        className="w-full py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 font-bold text-sm transition-all disabled:opacity-40"
                                    >
                                        🚀 Mark as In Progress
                                    </button>
                                )}

                                {tournament.status === "In Progress" && tournament.format !== "Free For All" && matches.length === 0 && (
                                    <button
                                        onClick={handleGenerateBracket}
                                        disabled={isPending || participants.length < 2}
                                        className="w-full py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 font-bold text-sm transition-all disabled:opacity-40"
                                    >
                                        🛠 Generate Brackets
                                    </button>
                                )}

                                {tournament.status === "In Progress" && (
                                    <button
                                        onClick={() => handleStatus("Ended")}
                                        disabled={isPending}
                                        className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold text-sm transition-all disabled:opacity-40"
                                    >
                                        🏁 Mark as Ended
                                    </button>
                                )}

                                {tournament.status === "Ended" && (
                                    <p className="text-xs text-gray-500 italic text-center py-1">Set placements via the participant list →</p>
                                )}

                                <div className="border-t border-white/10 pt-3">
                                    <button
                                        onClick={handleDelete}
                                        disabled={isPending}
                                        className="w-full py-2 rounded-xl bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 hover:border-red-500/30 text-red-500/70 hover:text-red-400 font-bold text-xs transition-all disabled:opacity-40"
                                    >
                                        🗑 Delete Tournament
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Stats box */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl space-y-3">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Stats</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Participants</span>
                                    <span className="font-bold text-white font-mono">{participants.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Format</span>
                                    <span className="font-bold text-white">{tournament.format}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Status</span>
                                    <span className={`font-bold text-xs uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusStyle[tournament.status]}`}>{tournament.status}</span>
                                </div>
                                {tournament.starts_at && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Starts</span>
                                        <span className="font-bold text-white text-xs">{new Date(tournament.starts_at).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
