"use client";

import { useEffect, useState } from "react";
import { ClanGoal, fetchClanGoals, createClanGoal, updateClanGoalStatus, deleteClanGoal, submitDirectiveContribution, fetchPendingContributions, verifyContribution, trackDirectiveView } from "./actions";
import GoalModal from "@/components/GoalModal";
import { useSession } from "next-auth/react";

export default function GoalsPage() {
    const { data: session } = useSession();
    const [goals, setGoals] = useState<ClanGoal[]>([]);
    const [pendingContribs, setPendingContribs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [activeContributeGoal, setActiveContributeGoal] = useState<string | null>(null);
    const [contribIngredient, setContribIngredient] = useState<string>("");
    const [contribAmount, setContribAmount] = useState<number | "">("");

    const isAdmin = session?.user && (session.user as any).role === 'Admin';

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await fetchClanGoals();
            setGoals(data);

            // Track views for active goals (fire and forget)
            Promise.all(data.filter(g => g.status !== 'Completed').map(g => trackDirectiveView(g.id).catch(() => { })));

            if (isAdmin) {
                const pending = await fetchPendingContributions();
                setPendingContribs(pending);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [isAdmin]);

    const handleCreateGoal = async (title: string, description: string, priority: string, projectName: string, imageUrl?: string, targetIngredients?: Record<string, number>) => {
        await createClanGoal(title, description, priority, projectName, imageUrl, targetIngredients);
        await loadData();
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        await updateClanGoalStatus(id, newStatus);
        setGoals(prev => prev.map(g => g.id === id ? { ...g, status: newStatus as any } : g));
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this directive?")) return;
        await deleteClanGoal(id);
        setGoals(prev => prev.filter(g => g.id !== id));
    };

    const handleContributeSubmit = async (e: React.FormEvent, goalId: string) => {
        e.preventDefault();
        if (!contribIngredient || !contribAmount) return;
        try {
            await submitDirectiveContribution(goalId, contribIngredient, Number(contribAmount));
            alert("Contribution submitted for verification!");
            setActiveContributeGoal(null);
            setContribIngredient("");
            setContribAmount("");
            if (isAdmin) {
                const pending = await fetchPendingContributions();
                setPendingContribs(pending);
            }
        } catch (e: any) {
            alert(e.message || "Failed to submit.");
        }
    };

    const handleVerify = async (id: string, accept: boolean) => {
        try {
            await verifyContribution(id, accept);
            await loadData(); // Reload to get updated current_ingredients
        } catch (e: any) {
            alert("Error verifying: " + e.message);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Critical': return 'text-rose-400 bg-rose-500/10 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.3)]';
            case 'High': return 'text-orange-400 bg-orange-500/10 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.3)]';
            case 'Medium': return 'text-[#5865F2] bg-[#5865F2]/10 border-[#5865F2]/30';
            case 'Low': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
            default: return 'text-gray-400 bg-white/5 border-white/10';
        }
    };

    const renderColumn = (statusHeading: string) => {
        const columnGoals = goals.filter(g => g.status === statusHeading);

        return (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 min-h-[600px] flex flex-col backdrop-blur-xl relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                    <h2 className="text-sm font-bold tracking-widest uppercase text-gray-300">{statusHeading}</h2>
                    <span className="text-white font-bold font-mono bg-[#5865F2]/20 border border-[#5865F2]/50 px-2 py-0.5 rounded text-xs shadow-inner">
                        {columnGoals.length}
                    </span>
                </div>

                <div className="space-y-6 flex-1">
                    {columnGoals.map(goal => (
                        <div key={goal.id} className="bg-white/5 border border-white/10 rounded-xl shadow-lg relative overflow-hidden group hover:border-[#5865F2]/50 transition-colors backdrop-blur-md">

                            {goal.image_url && (
                                <div className="w-full h-32 overflow-hidden border-b border-white/5 relative">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                                    <img src={goal.image_url} alt={goal.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                </div>
                            )}

                            <div className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex flex-wrap gap-2">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${getPriorityColor(goal.priority)}`}>
                                            {goal.priority}
                                        </span>
                                        {goal.project_name && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-[#5865F2]/30 bg-[#5865F2]/10 text-[#5865F2]">
                                                {goal.project_name}
                                            </span>
                                        )}
                                    </div>
                                    {isAdmin && (
                                        <button onClick={() => handleDelete(goal.id)} className="text-gray-500 hover:text-rose-500 transition-colors" title="Delete">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    )}
                                </div>

                                <h3 className="text-lg font-black tracking-wide text-white mb-2 leading-tight">{goal.title}</h3>
                                {goal.description && <p className="text-sm text-gray-400 mb-4 line-clamp-3 font-sans italic">{goal.description}</p>}

                                {/* Ingredients Progress */}
                                {goal.target_ingredients && Object.keys(goal.target_ingredients).length > 0 && (
                                    <div className="mb-4 bg-black/40 rounded-lg p-3 border border-white/5 shadow-inner">
                                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 border-b border-white/10 pb-1">Resources Required</h4>
                                        <div className="space-y-3">
                                            {Object.entries(goal.target_ingredients).map(([item, target]) => {
                                                const current = goal.current_ingredients?.[item] || 0;
                                                const pct = Math.min(100, Math.round((current / target) * 100));
                                                return (
                                                    <div key={item}>
                                                        <div className="flex justify-between text-xs font-mono mb-1">
                                                            <span className="text-gray-300">{item}</span>
                                                            <span className={pct >= 100 ? "text-emerald-400" : "text-[#5865F2]"}>{current} / {target}</span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                            <div className={`h-full ${pct >= 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-[#5865F2] shadow-[0_0_10px_rgba(88,101,242,0.5)]'}`} style={{ width: `${pct}%` }}></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {statusHeading !== 'Completed' && (
                                            <div className="mt-4 pt-3 border-t border-white/5">
                                                {activeContributeGoal === goal.id ? (
                                                    <form onSubmit={(e) => handleContributeSubmit(e, goal.id)} className="flex gap-2 animate-in fade-in zoom-in duration-200">
                                                        <select value={contribIngredient} onChange={(e) => setContribIngredient(e.target.value)} className="bg-black/50 border border-white/10 text-xs text-gray-200 p-1.5 rounded-md flex-1 outline-none focus:border-[#5865F2]/50">
                                                            <option value="">Select Resource</option>
                                                            {Object.keys(goal.target_ingredients).map(i => <option key={i} value={i}>{i}</option>)}
                                                        </select>
                                                        <input type="number" placeholder="Amt" value={contribAmount} onChange={e => setContribAmount(parseInt(e.target.value) || "")} className="w-16 bg-black/50 border border-white/10 text-xs text-gray-200 px-2 rounded-md outline-none focus:border-[#5865F2]/50" />
                                                        <button type="submit" className="bg-[#5865F2]/20 hover:bg-[#5865F2]/40 text-[#5865F2] border border-[#5865F2]/50 px-3 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm">Log</button>
                                                        <button type="button" onClick={() => setActiveContributeGoal(null)} className="text-gray-500 hover:text-white px-2 text-xs">✕</button>
                                                    </form>
                                                ) : (
                                                    <button onClick={() => setActiveContributeGoal(goal.id)} className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-[10px] font-bold uppercase tracking-widest text-[#5865F2] transition-colors shadow-sm">
                                                        Contribute Payload
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-between mt-auto border-t border-white/10 pt-3">
                                    <div className="flex items-center gap-3">
                                        <div className="text-[10px] sm:text-xs text-gray-500 font-mono tracking-tighter">
                                            {new Date(goal.created_at || Date.now()).toLocaleDateString()}
                                        </div>
                                        {isAdmin && (
                                            <div className="flex items-center gap-1 text-[10px] text-gray-600 font-mono bg-white/5 px-2 py-0.5 rounded-md" title="Unique Views">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                {goal.view_count || 0}
                                            </div>
                                        )}
                                    </div>
                                    {isAdmin && (
                                        <div className="flex gap-2">
                                            {statusHeading !== 'Not Started' && (
                                                <button onClick={() => handleUpdateStatus(goal.id, statusHeading === 'Completed' ? 'In Progress' : 'Not Started')} className="p-1.5 rounded-md bg-white/5 border border-white/10 hover:border-[#5865F2]/50 text-gray-400 hover:text-white transition-all shadow-sm" title="Move Backwards">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                                </button>
                                            )}
                                            {statusHeading !== 'Completed' && (
                                                <button onClick={() => handleUpdateStatus(goal.id, statusHeading === 'Not Started' ? 'In Progress' : 'Completed')} className="p-1.5 rounded-md bg-[#5865F2]/20 border border-[#5865F2]/50 hover:bg-[#5865F2] hover:text-white text-[#5865F2] transition-all shadow-sm" title="Advance Status">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {columnGoals.length === 0 && !isLoading && (
                        <div className="flex flex-col flex-1 h-32 items-center justify-center border-2 border-dashed border-white/5 rounded-xl bg-black/10">
                            <span className="text-gray-600 text-[10px] font-bold uppercase tracking-widest text-center px-4">No objectives active</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-transparent text-gray-200 p-4 sm:p-8 font-sans selection:bg-[#5865F2]/30">
            <div className="max-w-[1500px] mx-auto space-y-8 relative z-10 flex flex-col lg:flex-row gap-8">

                <div className="flex-1 space-y-8">
                    {/* Header Strip */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-6 border-b border-white/10">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                                Clan <span className="text-[#5865F2]">Directives</span>
                            </h1>
                            <p className="text-gray-400 font-sans text-lg">Coordinate strategic goals and trace supply lines.</p>
                        </div>

                        {isAdmin && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full sm:w-auto bg-[#5865F2]/90 hover:bg-[#5865F2] text-white font-bold tracking-widest uppercase py-3 px-8 rounded-xl shadow-[0_4px_20px_rgba(88,101,242,0.3)] transition-all hover:-translate-y-0.5 border border-[#5865F2]"
                            >
                                Issue Directive
                            </button>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="h-[40vh] flex flex-col items-center justify-center gap-4">
                            <div className="w-8 h-8 rounded-full border-4 border-white/10 border-t-[#5865F2] animate-spin"></div>
                            <p className="text-[#5865F2] font-mono text-xs tracking-widest uppercase animate-pulse">Syncing Network...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {renderColumn("Not Started")}
                            {renderColumn("In Progress")}
                            {renderColumn("Completed")}
                        </div>
                    )}
                </div>

                {/* Right Sidebar: Admin Approvals */}
                {isAdmin && pendingContribs.length > 0 && (
                    <div className="w-full lg:w-80 shrink-0">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl sticky top-8">
                            <h3 className="text-sm font-bold tracking-widest uppercase text-white flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
                                <span className="animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)] w-2 h-2 rounded-full bg-rose-500 inline-block"></span> Pending Intel
                            </h3>
                            <div className="space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                                {pendingContribs.map(c => (
                                    <div key={c.id} className="bg-black/40 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-sm font-bold text-gray-200">{c.Users?.display_name || "Unknown"}</span>
                                            <span className="text-[10px] text-gray-500 font-mono bg-white/5 px-2 py-0.5 rounded-md">{new Date(c.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-[10px] text-[#5865F2] font-bold uppercase tracking-wider bg-[#5865F2]/10 border border-[#5865F2]/20 px-1.5 py-0.5 rounded inline-block mb-3 truncate max-w-[200px]">{c.Clan_Goals?.title || "Unknown Goal"}</p>

                                        <div className="text-sm font-mono text-emerald-400 bg-white/5 border border-white/5 rounded-lg p-3 mb-4 shadow-inner">
                                            + {c.amount} {c.ingredient_name}
                                        </div>

                                        <div className="flex gap-2">
                                            <button onClick={() => handleVerify(c.id, true)} className="flex-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all">Verify</button>
                                            <button onClick={() => handleVerify(c.id, false)} className="flex-1 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all">Reject</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <GoalModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateGoal}
            />
        </div>
    );
}
