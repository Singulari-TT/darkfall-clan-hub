"use client";
import { useState } from "react";
import { TournamentMatch, updateMatchResult } from "../actions";

interface BracketProps {
    matches: TournamentMatch[];
    isCreator: boolean;
    onRefresh: () => void;
}

export default function TournamentBracket({ matches, isCreator, onRefresh }: BracketProps) {
    const [reportingMatch, setReportingMatch] = useState<TournamentMatch | null>(null);
    const [score1, setScore1] = useState(0);
    const [score2, setScore2] = useState(0);
    const [winnerId, setWinnerId] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Group matches by round
    const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b);

    const handleReport = async () => {
        if (!reportingMatch || !winnerId) return;
        setIsSaving(true);
        try {
            await updateMatchResult(reportingMatch.id, winnerId, score1, score2);
            setReportingMatch(null);
            onRefresh();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (matches.length === 0) {
        return (
            <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl border-dashed">
                <p className="text-gray-500 italic">Bracket structure not yet generated.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 overflow-x-auto pb-8">
            <div className="flex gap-12 min-w-max px-4">
                {rounds.map((roundNum) => (
                    <div key={roundNum} className="flex flex-col justify-around gap-8 w-64">
                        <h3 className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                            Round {roundNum}
                        </h3>
                        {matches
                            .filter((m) => m.round === roundNum)
                            .map((match) => {
                                const isFinalized = !!match.winner_id;
                                return (
                                    <div
                                        key={match.id}
                                        onClick={() => isCreator && !isFinalized && setReportingMatch(match)}
                                        className={`group relative bg-black/40 border rounded-xl overflow-hidden transition-all ${isCreator && !isFinalized ? "cursor-pointer hover:border-amber-500/50" : "border-white/5"
                                            } ${isFinalized ? "opacity-80" : ""}`}
                                    >
                                        {/* Player 1 */}
                                        <div className={`px-3 py-2 flex justify-between items-center border-b border-white/5 ${match.winner_id === match.player1_id ? "bg-amber-500/10" : ""}`}>
                                            <span className={`text-sm truncate ${match.winner_id === match.player1_id ? "text-amber-400 font-bold" : "text-gray-300"}`}>
                                                {match.player1_name}
                                            </span>
                                            <span className="text-xs font-mono text-gray-500">{match.player1_score}</span>
                                        </div>
                                        {/* Player 2 */}
                                        <div className={`px-3 py-2 flex justify-between items-center ${match.winner_id === match.player2_id ? "bg-amber-500/10" : ""}`}>
                                            <span className={`text-sm truncate ${match.winner_id === match.player2_id ? "text-amber-400 font-bold" : "text-gray-300"}`}>
                                                {match.player2_name}
                                            </span>
                                            <span className="text-xs font-mono text-gray-500">{match.player2_score}</span>
                                        </div>

                                        {isCreator && !isFinalized && (
                                            <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/5 flex items-center justify-center pointer-events-none">
                                                <span className="text-[10px] font-bold text-amber-500 opacity-0 group-hover:opacity-100 uppercase tracking-tighter">Report Result</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                ))}
            </div>

            {/* Simple Report Modal */}
            {reportingMatch && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#0D1117] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-6 animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold text-white">Report Match Result</h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-sm text-gray-300 truncate flex-1">{reportingMatch.player1_name}</span>
                                <input
                                    type="number"
                                    className="w-16 bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-center"
                                    value={score1}
                                    onChange={(e) => setScore1(parseInt(e.target.value) || 0)}
                                />
                                <button
                                    onClick={() => setWinnerId(reportingMatch.player1_id || "")}
                                    className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all ${winnerId === reportingMatch.player1_id ? "bg-amber-500 border-amber-500 text-black" : "border-white/10 text-gray-500"}`}
                                >
                                    Winner
                                </button>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-sm text-gray-300 truncate flex-1">{reportingMatch.player2_name}</span>
                                <input
                                    type="number"
                                    className="w-16 bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-center"
                                    value={score2}
                                    onChange={(e) => setScore2(parseInt(e.target.value) || 0)}
                                />
                                <button
                                    onClick={() => setWinnerId(reportingMatch.player2_id || "")}
                                    className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all ${winnerId === reportingMatch.player2_id ? "bg-amber-500 border-amber-500 text-black" : "border-white/10 text-gray-500"}`}
                                >
                                    Winner
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleReport}
                                disabled={isSaving || !winnerId}
                                className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 font-bold py-2.5 rounded-xl transition-all disabled:opacity-30"
                            >
                                {isSaving ? "Saving..." : "Confirm Result"}
                            </button>
                            <button
                                onClick={() => setReportingMatch(null)}
                                className="px-5 bg-white/5 border border-white/10 text-gray-400 font-bold rounded-xl"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
