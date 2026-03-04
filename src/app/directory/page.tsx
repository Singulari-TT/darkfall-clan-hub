import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function Directory() {
    const session = await getServerSession(authOptions);

    // Basic check - realistically we would fetch the user's role from the DB here
    // to determine if they are an Admin and can see `admin_only` characters.
    let isAdmin = false;

    if (session?.user?.id) {
        const { data: userRole } = await supabase
            .from("Users")
            .select("role")
            .eq("discord_id", session.user.id)
            .single();
        if (userRole && userRole.role === 'Admin') isAdmin = true;
    }

    // Fetch Users and their associated visible Characters
    const { data: users, error } = await supabase
        .from("Users")
        .select(`
      id,
      discord_id,
      display_name,
      role,
      status,
      Characters (
        id,
        name,
        is_visible,
        admin_only
      )
    `)
        .eq("status", "Active")
        .neq("discord_id", "mock_discord_admin");

    if (error) {
        console.error("Error fetching directory:", error);
        return <div className="p-8 text-red-500">Failed to load directory.</div>;
    }

    // We can sort them to put Admins first, then standard members.
    const sortedUsers = users?.sort((a, b) => {
        if (a.role === 'Admin' && b.role !== 'Admin') return -1;
        if (a.role !== 'Admin' && b.role === 'Admin') return 1;
        return (a.display_name || "").localeCompare(b.display_name || "");
    }) || [];

    return (
        <div className="min-h-screen bg-transparent text-gray-300 p-4 sm:p-8 font-sans selection:bg-red-900/50">
            <div className="max-w-7xl mx-auto space-y-8 relative z-10">
                <header className="border-b border-red-900/40 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-[#c5a059] tracking-widest uppercase mb-2 drop-shadow-md">
                            Clan Roster
                        </h1>
                        <p className="text-gray-400 font-serif italic text-lg">Active brothers and sisters of the Dreadkrew. Verily witness their declared avatars.</p>
                    </div>
                    {session?.user && (
                        <Link href="/profile" className="w-full md:w-auto text-center inline-block bg-gradient-to-r from-[#c5a059]/80 to-[#a38040]/80 hover:from-[#c5a059] hover:to-[#a38040] text-black font-black font-heading tracking-widest uppercase py-3 px-8 rounded shadow-[0_0_20px_rgba(197,160,89,0.3)] transition-all">
                            Update Dossier
                        </Link>
                    )}
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedUsers.map((user: any) => {
                        const isCurrentUser = session?.user?.id === user.discord_id;
                        const isAdminRole = user.role === 'Admin';

                        return (
                            <div key={user.id} className={`bg - [#1a151b] / 80 border ${isCurrentUser ? 'border-[#c5a059] shadow-[0_0_20px_rgba(197,160,89,0.2)]' : 'border-red-900/30'} rounded - xl overflow - hidden hover: border - red - 500 / 50 transition - all group backdrop - blur - sm relative flex flex - col`}>
                                {/* Header banner style */}
                                <div className={`h - [72px] w - full ${isAdminRole ? 'bg-gradient-to-r from-red-950 to-black border-b border-red-900/50' : 'bg-black/50 border-b border-stone-800'}`}>
                                    {isAdminRole && <div className="absolute top-0 right-0 w-32 h-32 bg-red-900/20 rounded-full blur-3xl pointer-events-none -mt-10 -mr-10"></div>}
                                </div>

                                {/* Avatar placeholder sitting on the border */}
                                <div className={`absolute top - 8 left - 6 w - 16 h - 16 rounded - full border - 2 ${isCurrentUser ? 'border-[#c5a059]' : 'border-[#1a151b]'} bg - gradient - to - br from - stone - 800 to - black flex items - center justify - center shadow - lg overflow - hidden group - hover: border - [#c5a059] / 50 transition - colors z - 10`}>
                                    <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">{isAdminRole ? '👑' : '🛡️'}</span>
                                </div>

                                <div className="pt-10 px-6 pb-6 flex-1 flex flex-col relative z-10 mt-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col">
                                            <h2 className="text-xl font-heading font-black text-gray-100 group-hover:text-white transition-colors truncate max-w-[200px]">
                                                {user.display_name || "Unknown Initiated"}
                                            </h2>
                                            <div className="flex gap-2 items-center mt-1.5 flex-wrap">
                                                <span className={`text - [9px] uppercase tracking - widest font - bold px - 2 py - 0.5 rounded border ${isAdminRole ? 'bg-red-950 text-[#c5a059] border-[#c5a059]/30' : 'bg-stone-900 text-stone-400 border-stone-700'}`}>
                                                    {user.role}
                                                </span>
                                                {isCurrentUser && <span className="text-[9px] uppercase tracking-widest font-bold bg-[#c5a059]/20 text-[#c5a059] px-2 py-0.5 rounded border border-[#c5a059]/30">You</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-red-900/20">
                                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-heading mb-3 flex items-center gap-2">
                                            Declared Avatars
                                            <span className="bg-[#0e0c10] border border-red-900/30 text-[#c5a059] font-mono px-1.5 rounded">{user.Characters?.filter((c: any) => c.is_visible && (!c.admin_only || isAdmin)).length || 0}</span>
                                        </h3>

                                        {user.Characters && user.Characters.length > 0 ? (
                                            <ul className="space-y-2">
                                                {user.Characters
                                                    // Filter characters based on visibility and admin_only status
                                                    .filter((c: any) => c.is_visible && (!c.admin_only || isAdmin))
                                                    .map((char: any) => (
                                                        <li key={char.id} className="flex justify-between items-center bg-black/40 border border-red-900/20 px-3 py-1.5 rounded text-sm text-gray-300 shadow-inner group/char">
                                                            <span className="font-heading truncate flex-1">{char.name}</span>
                                                            {char.admin_only && (
                                                                <span className="ml-2 text-[8px] uppercase tracking-widest text-red-500 font-bold bg-red-950/80 px-1.5 py-0.5 rounded border border-red-900/50 shadow-[0_0_5px_rgba(139,0,0,0.5)]">Shadow</span>
                                                            )}
                                                        </li>
                                                    ))}
                                            </ul>
                                        ) : (
                                            <div className="bg-black/20 border border-dashed border-red-900/20 rounded p-3 text-center">
                                                <p className="text-gray-600 italic text-xs font-serif">No characters revealed.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    {(!users || users.length === 0) && (
                        <div className="col-span-full py-16 flex justify-center">
                            <div className="bg-[#1a151b]/80 border border-red-900/30 rounded-xl p-8 text-center max-w-md backdrop-blur-sm">
                                <p className="text-gray-400 font-serif italic mb-2">The roster is empty.</p>
                                <p className="text-xs text-[#c5a059] uppercase tracking-widest font-bold font-heading">No members found</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
