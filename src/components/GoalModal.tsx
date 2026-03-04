"use client";

import { useState } from "react";

interface GoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string, description: string, priority: string, projectName: string, imageUrl?: string, targetIngredients?: Record<string, number>) => Promise<void>;
}

export default function GoalModal({ isOpen, onClose, onSubmit }: GoalModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [projectName, setProjectName] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [ingredientsText, setIngredientsText] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsLoading(true);
        try {
            // Parse ingredients
            const targets: Record<string, number> = {};
            if (ingredientsText.trim()) {
                const pairs = ingredientsText.split(',');
                pairs.forEach(pair => {
                    const [k, v] = pair.split(':');
                    if (k && v && !isNaN(parseInt(v.trim()))) {
                        targets[k.trim()] = parseInt(v.trim());
                    }
                });
            }

            await onSubmit(title, description, priority, projectName, imageUrl, targets);
            setTitle("");
            setDescription("");
            setProjectName("");
            setPriority("Medium");
            setImageUrl("");
            setIngredientsText("");
            onClose();
        } catch (error) {
            console.error("Failed to submit goal");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1a151b] border border-[#c5a059]/50 rounded-2xl w-full max-w-lg shadow-[0_0_40px_rgba(139,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-red-950/40 px-6 py-4 border-b border-red-900/50 flex justify-between items-center">
                    <h2 className="text-xl font-black font-heading tracking-widest uppercase text-[#c5a059] flex items-center gap-2">
                        <span>🎯</span> Issue New Directive
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <div>
                        <label className="block text-xs font-bold font-heading tracking-widest uppercase text-gray-400 mb-1">Directive Title *</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Capture Western Hamlet"
                            className="w-full bg-[#0e0c10] border border-red-900/30 rounded px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#c5a059] transition-all font-medium"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold font-heading tracking-widest uppercase text-gray-400 mb-1">Tactical Briefing</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Provide operational details..."
                            rows={3}
                            className="w-full bg-[#0e0c10] border border-red-900/30 rounded px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#c5a059] transition-all text-sm resize-none font-serif italic"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold font-heading tracking-widest uppercase text-gray-400 mb-1">Image / Map URL</label>
                            <input
                                type="url"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-[#0e0c10] border border-red-900/30 rounded px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#c5a059] transition-all text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold font-heading tracking-widest uppercase text-gray-400 mb-1">Associated Project</label>
                            <input
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder="e.g. Operation Breakout"
                                className="w-full bg-[#0e0c10] border border-red-900/30 rounded px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#c5a059] transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold font-heading tracking-widest uppercase text-gray-400 mb-1">Required Materials (Comma Separated)</label>
                        <textarea
                            value={ingredientsText}
                            onChange={(e) => setIngredientsText(e.target.value)}
                            placeholder="e.g. Wood: 5000, Iron Ingot: 200, Gold: 1500"
                            rows={2}
                            className="w-full bg-[#0e0c10] border border-red-900/30 rounded px-4 py-2 text-emerald-400 font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-all resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold font-heading tracking-widest uppercase text-gray-400 mb-1">Priority Level</label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                            {['Low', 'Medium', 'High', 'Critical'].map(level => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setPriority(level)}
                                    className={`py-2 text-[10px] font-black uppercase tracking-widest rounded border transition-all \${priority === level
                                        ? \`bg-black text-white \${level === 'Critical' ? 'border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' :
                                            level === 'High' ? 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]' :
                                                level === 'Medium' ? 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' :
                                                    'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                        }\`
                                        : 'bg-[#0e0c10] border-red-900/30 text-gray-500 hover:border-gray-500'
                                        }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-red-900/40 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 rounded text-xs font-bold font-heading uppercase tracking-widest text-gray-400 hover:text-white hover:bg-red-950 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`px-6 py-2 rounded text-xs font-black font-heading uppercase tracking-widest text-black shadow-lg transition-all \${isLoading ? 'bg-[#c5a059]/50 cursor-not-allowed' : 'bg-gradient-to-r from-[#c5a059] to-[#a38040] hover:scale-105 shadow-[#c5a059]/20'
                                }`}
                        >
                            {isLoading ? 'Authorizing...' : 'Issue Directive'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
