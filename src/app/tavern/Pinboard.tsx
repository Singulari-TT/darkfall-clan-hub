"use client";

import { useState, useTransition } from "react";
import { TavernPost, createTavernPost, deleteTavernPost } from "./actions";
import { useSession } from "next-auth/react";

const PIN_COLORS = [
    { name: "indigo", bg: "bg-[#5865F2]/15", border: "border-[#5865F2]/40", text: "text-[#5865F2]", pin: "bg-[#5865F2]" },
    { name: "amber", bg: "bg-amber-500/15", border: "border-amber-500/40", text: "text-amber-400", pin: "bg-amber-500" },
    { name: "rose", bg: "bg-rose-500/15", border: "border-rose-500/40", text: "text-rose-400", pin: "bg-rose-500" },
    { name: "emerald", bg: "bg-emerald-500/15", border: "border-emerald-500/40", text: "text-emerald-400", pin: "bg-emerald-500" },
    { name: "cyan", bg: "bg-cyan-500/15", border: "border-cyan-500/40", text: "text-cyan-400", pin: "bg-cyan-500" },
];

function formatRelative(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export function Pinboard({ initialPosts, currentUserId, isAdmin }: {
    initialPosts: TavernPost[];
    currentUserId: string;
    isAdmin: boolean;
}) {
    const [posts, setPosts] = useState<TavernPost[]>(initialPosts);
    const [draft, setDraft] = useState("");
    const [selectedColor, setSelectedColor] = useState(PIN_COLORS[0].name);
    const [isPending, startTransition] = useTransition();
    const [charCount, setCharCount] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const handlePost = () => {
        if (!draft.trim() || isPending) return;
        setError(null);
        const color = selectedColor;
        const optimisticPost: TavernPost = {
            id: `temp-${Date.now()}`,
            author_discord_id: currentUserId,
            author_name: "You",
            content: draft.trim(),
            color,
            created_at: new Date().toISOString(),
        };
        setPosts(prev => [optimisticPost, ...prev]);
        const msg = draft.trim();
        setDraft("");
        setCharCount(0);
        startTransition(async () => {
            const result = await createTavernPost(msg, color);
            if (!result.success) {
                setError(result.error || "Failed to post.");
                setPosts(prev => prev.filter(p => p.id !== optimisticPost.id));
            }
        });
    };

    const handleDelete = (id: string) => {
        setPosts(prev => prev.filter(p => p.id !== id));
        startTransition(async () => {
            const result = await deleteTavernPost(id);
            if (!result.success) setPosts(initialPosts); // revert on fail
        });
    };

    const maxChars = 280;
    const colorObj = PIN_COLORS.find(c => c.name === selectedColor) || PIN_COLORS[0];

    return (
        <div className="space-y-6">
            {/* Composer */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.15)]">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-lg">📌</span>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Pin a Note</h3>
                    {/* Color picker */}
                    <div className="flex gap-1.5 ml-auto">
                        {PIN_COLORS.map(c => (
                            <button
                                key={c.name}
                                onClick={() => setSelectedColor(c.name)}
                                className={`w-5 h-5 rounded-full ${c.pin} transition-all ${selectedColor === c.name ? "ring-2 ring-white/50 scale-125" : "opacity-50 hover:opacity-100"}`}
                                title={c.name}
                            />
                        ))}
                    </div>
                </div>

                <textarea
                    value={draft}
                    onChange={e => { setDraft(e.target.value); setCharCount(e.target.value.length); }}
                    onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handlePost(); }}
                    maxLength={maxChars}
                    rows={3}
                    placeholder="Leave a note for the tavern... (Ctrl+Enter to post)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-gray-200 text-sm placeholder-gray-600 outline-none focus:border-white/20 resize-none transition-colors font-sans"
                />
                <div className="flex justify-between items-center mt-3">
                    <span className={`text-[10px] font-mono ${charCount > 240 ? "text-rose-400" : "text-gray-600"}`}>
                        {charCount}/{maxChars}
                    </span>
                    {error && <span className="text-xs text-rose-400">{error}</span>}
                    <button
                        onClick={handlePost}
                        disabled={!draft.trim() || isPending}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${draft.trim() && !isPending
                            ? `${colorObj.bg} ${colorObj.border} ${colorObj.text} hover:opacity-80`
                            : "bg-white/5 border-white/10 text-gray-600 cursor-not-allowed"
                            }`}
                    >
                        {isPending ? "Posting..." : "Pin It"}
                    </button>
                </div>
            </div>

            {/* Posts grid */}
            {posts.length === 0 ? (
                <div className="text-center py-16 text-gray-600 border-2 border-dashed border-white/5 rounded-2xl">
                    <p className="text-4xl mb-3">📭</p>
                    <p className="text-sm font-bold uppercase tracking-widest">The board is empty</p>
                    <p className="text-xs mt-1">Be the first to pin something</p>
                </div>
            ) : (
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-0">
                    {posts.map((post) => {
                        const c = PIN_COLORS.find(x => x.name === post.color) || PIN_COLORS[0];
                        const canDelete = isAdmin || post.author_discord_id === currentUserId;
                        return (
                            <div
                                key={post.id}
                                className={`break-inside-avoid mb-4 ${c.bg} border ${c.border} rounded-xl p-4 relative group shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-sm`}
                            >
                                {/* Pin dot */}
                                <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full ${c.pin} shadow-md border-2 border-black/20`} />

                                <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words pt-1">
                                    {post.content}
                                </p>

                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                                    <span className={`text-[10px] font-bold ${c.text} truncate max-w-[120px]`}>
                                        {post.author_name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-600 font-mono">
                                            {formatRelative(post.created_at)}
                                        </span>
                                        {canDelete && (
                                            <button
                                                onClick={() => handleDelete(post.id)}
                                                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-rose-400 transition-all text-xs"
                                                title="Remove"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
