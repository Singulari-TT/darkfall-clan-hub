import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";
import { Pinboard } from "./Pinboard";
import { fetchTavernPosts } from "./actions";
import { ArrowLeft } from "lucide-react";

export default async function TavernPage() {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id || "";
    const isAdmin = (session?.user as any)?.role === "Admin";

    // Fetch roster
    const { data: users, error } = await supabase
        .from("Users")
        .select(`
            id, discord_id, display_name, role, created_at, status,
            Characters (id, name, is_visible, admin_only, is_main, is_online, last_online)
        `)
        .eq("status", "Active")
        .neq("discord_id", "mock_discord_admin")
        .order("role", { ascending: false });

    const sortedUsers = (users || []).sort((a: any, b: any) => {
        if (a.role === "Admin" && b.role !== "Admin") return -1;
        if (a.role !== "Admin" && b.role === "Admin") return 1;
        return (a.display_name || "").localeCompare(b.display_name || "");
    });

    // Fetch pinboard posts
    const posts = await fetchTavernPosts();

    return (
        <div className="min-h-screen bg-transparent text-gray-300 font-sans selection:bg-[#5865F2]/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 relative z-10">

                {/* Header */}
                <header className="border-b border-white/10 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/"
                            className="p-2.5 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10 group"
                            title="Back to Command"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-[#5865F2]" />
                        </Link>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black font-heading text-white tracking-widest mb-2 drop-shadow-md uppercase">
                                <span className="text-[#5865F2]">Roster</span>
                            </h1>
                            <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
                                Member Roster · Clan bulletin board · Off-duty comms
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/profile"
                        className="w-full sm:w-auto text-center bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 hover:border-[#5865F2]/60 text-[#5865F2] font-bold tracking-wider py-2.5 px-6 rounded-xl transition-all text-sm"
                    >
                        Update Dossier
                    </Link>
                </header>

                {/* Two-column layout: Roster + Pinboard */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">

                    {/* === LEFT: Pinboard === */}
                    <div className="xl:col-span-2 space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Bulletin Board</h2>
                            <div className="flex-1 h-px bg-white/5" />
                            <span className="text-[10px] text-gray-600 font-mono">{posts.length} notes pinned</span>
                        </div>
                        <Pinboard
                            initialPosts={posts}
                            currentUserId={currentUserId}
                            isAdmin={isAdmin}
                        />
                    </div>

                    {/* === RIGHT: Operative Roll Call === */}
                    <div className="xl:col-span-1 space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                Member List
                            </h2>
                            <div className="flex-1 h-px bg-white/5" />
                            <span className="text-[10px] text-gray-600 font-mono">{sortedUsers.length}</span>
                        </div>

                        <div className="space-y-2">
                            {sortedUsers.map((user: any) => {
                                const isCurrentUser = currentUserId === user.discord_id;
                                const isAdminRole = user.role === "Admin";
                                const mainChar = user.Characters?.find((c: any) => c.is_main);
                                const isOnline = mainChar?.is_online;
                                const lastSeen = mainChar?.last_online;

                                return (
                                    <div
                                        key={user.id}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-card border transition-all group backdrop-blur-[--blur-glass] ${isCurrentUser
                                            ? "bg-social-cobalt-dim border-social-cobalt-border"
                                            : "bg-surface border-surface-border hover:bg-surface-hover hover:border-surface-border-bright"
                                            }`}
                                    >
                                        {/* Avatar icon */}
                                        <div className="relative shrink-0">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border text-lg ${isAdminRole ? "bg-social-cobalt-dim border-social-cobalt-border" : "bg-white/5 border-surface-border"}`}>
                                                {isAdminRole ? "👑" : (mainChar ? "🗡️" : "🛡️")}
                                            </div>
                                            {isOnline && (
                                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full animate-pulse" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-white truncate">
                                                    {user.display_name || (user.Characters?.find((c: any) => c.is_main)?.name) || "Unknown Operative"}
                                                </span>
                                                {isCurrentUser && (
                                                    <span className="text-[9px] text-social-cobalt font-bold uppercase tracking-wider bg-social-cobalt-dim border border-social-cobalt-border px-1.5 py-0.5 rounded">
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {mainChar ? (
                                                    <span className="text-[10px] text-gray-500 font-mono truncate flex items-center gap-2">
                                                        {mainChar.name}
                                                        {lastSeen && !isOnline && (
                                                            <span className="text-[9px] text-stone-600 font-serif lowercase italic">
                                                                · last seen {new Date(lastSeen).toLocaleDateString() === new Date().toLocaleDateString()
                                                                    ? new Date(lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                                    : new Date(lastSeen).toLocaleDateString()
                                                                }
                                                            </span>
                                                        )}
                                                        {isOnline && (
                                                            <span className="text-[9px] text-emerald-500 font-serif lowercase italic">
                                                                · online now
                                                            </span>
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-amber-600/70 italic">No main registered</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex items-center gap-1.5">
                                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${isAdminRole ? "bg-social-cobalt-dim text-social-cobalt border-social-cobalt-border" : "bg-white/5 text-gray-500 border-surface-border"}`}>
                                                {user.role}
                                            </span>
                                            <a
                                                href={`discord://-/users/${user.discord_id}`}
                                                className="p-1.5 rounded-lg bg-white/5 hover:bg-social-cobalt-dim text-gray-500 hover:text-social-cobalt border border-surface-border hover:border-social-cobalt-border transition-all opacity-0 group-hover:opacity-100"
                                                title="Open in Discord"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.98 12.98 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.947 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z" />
                                                </svg>
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
