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
        <div className="min-h-screen bg-transparent text-gray-300 p-4 sm:p-8 font-sans selection:bg-[#5865F2]/30">
            <div className="max-w-7xl mx-auto space-y-8 relative z-10">
                <header className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black font-heading text-white tracking-widest mb-2 drop-shadow-md">
                            Clan <span className="text-[#5865F2]">Roster</span>
                        </h1>
                        <p className="text-gray-400 font-sans text-lg">Active operatives of the Dreadkrew. View verified database identities and credentials.</p>
                    </div>
                    {session?.user && (
                        <Link href="/profile" className="w-full md:w-auto text-center inline-block bg-[#5865F2]/90 hover:bg-[#5865F2] text-white font-bold tracking-wider py-3 px-8 rounded-lg shadow-[0_0_20px_rgba(88,101,242,0.3)] transition-all">
                            Update Dossier
                        </Link>
                    )}
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedUsers.map((user: any) => {
                        const isCurrentUser = session?.user?.id === user.discord_id;
                        const isAdminRole = user.role === 'Admin';

                        return (
                            <div key={user.id} className={`bg-white/5 border ${isCurrentUser ? 'border-[#5865F2] shadow-[0_0_20px_rgba(88,101,242,0.2)]' : 'border-white/10'} rounded-2xl overflow-hidden hover:border-[#5865F2]/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 group backdrop-blur-xl relative flex flex-col`}>
                                {/* Header banner style */}
                                <div className={`h-[72px] w-full ${isAdminRole ? 'bg-gradient-to-r from-[#5865F2]/20 to-black/50 border-b border-[#5865F2]/30' : 'bg-black/40 border-b border-white/5'}`}>
                                    {isAdminRole && <div className="absolute top-0 right-0 w-32 h-32 bg-[#5865F2]/20 rounded-full blur-3xl pointer-events-none -mt-10 -mr-10"></div>}
                                </div>

                                {/* Avatar placeholder sitting on the border */}
                                <div className={`absolute top-8 left-6 w-16 h-16 rounded-xl border-2 ${isCurrentUser ? 'border-[#5865F2]' : 'border-white/10'} bg-[#0D1117] flex items-center justify-center shadow-lg overflow-hidden group-hover:border-[#5865F2]/50 transition-colors z-10`}>
                                    <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">{isAdminRole ? '👑' : '🛡️'}</span>
                                </div>

                                <div className="pt-10 px-6 pb-6 flex-1 flex flex-col relative z-10 mt-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col">
                                            <h2 className="text-xl font-bold text-white transition-colors truncate max-w-[200px] tracking-tight">
                                                {user.display_name || "Unknown Initiated"}
                                            </h2>
                                            <div className="flex gap-2 items-center mt-1.5 flex-wrap">
                                                <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md border ${isAdminRole ? 'bg-[#5865F2]/20 text-[#5865F2] border-[#5865F2]/30' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                                                    {user.role}
                                                </span>
                                                {isCurrentUser && <span className="text-[9px] uppercase tracking-widest font-bold bg-[#10b981]/20 text-[#10b981] px-2 py-0.5 rounded-md border border-[#10b981]/30">You</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-white/5">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            Identities
                                            <span className="bg-black/50 border border-white/10 text-[#5865F2] font-mono px-1.5 rounded-md shadow-inner">{user.Characters?.filter((c: any) => c.is_visible && (!c.admin_only || isAdmin)).length || 0}</span>
                                        </h3>

                                        {user.Characters && user.Characters.length > 0 ? (
                                            <ul className="space-y-2">
                                                {user.Characters
                                                    // Filter characters based on visibility and admin_only status
                                                    .filter((c: any) => c.is_visible && (!c.admin_only || isAdmin))
                                                    .map((char: any) => (
                                                        <li key={char.id} className="flex justify-between items-center bg-black/30 border border-white/5 px-3 py-1.5 rounded-lg text-sm text-gray-300 shadow-inner group/char hover:bg-black/50 hover:border-[#5865F2]/30 transition-colors">
                                                            <span className="truncate flex-1 font-medium">{char.name}</span>
                                                            {char.admin_only && (
                                                                <span className="ml-2 text-[8px] uppercase tracking-widest text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/30">Shadow</span>
                                                            )}
                                                        </li>
                                                    ))}
                                            </ul>
                                        ) : (
                                            <div className="bg-black/20 border border-dashed border-white/10 rounded-lg p-3 text-center">
                                                <p className="text-gray-500 italic text-xs">No identities revealed.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    {(!users || users.length === 0) && (
                        <div className="col-span-full py-16 flex justify-center">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center max-w-md backdrop-blur-xl">
                                <p className="text-gray-400 mb-2">The roster is returning empty.</p>
                                <p className="text-xs text-[#5865F2] uppercase tracking-widest font-bold">No connections found</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
