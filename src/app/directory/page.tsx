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
      created_at,
      Characters (
        id,
        name,
        is_visible,
        admin_only,
        is_main
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
                        <h1 className="text-3xl md:text-4xl font-black font-heading text-white tracking-widest mb-1 drop-shadow-md uppercase">
                            Clan <span className="text-[#5865F2]">Roster</span>
                        </h1>
                        <p className="text-gray-500 font-mono text-xs uppercase tracking-tight">Active database identities of the Dreadkrew. Verified credentials only.</p>
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
                        const mainChar = user.Characters?.find((c: any) => c.is_main);
                        const isVerified = !!mainChar;
                        const joinDate = new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

                        return (
                            <div key={user.id} className={`bg-black/60 border ${isCurrentUser ? 'border-[#5865F2] shadow-[0_0_20px_rgba(88,101,242,0.2)]' : 'border-white/5'} rounded-xl overflow-hidden hover:border-[#5865F2]/50 hover:shadow-[0_8px_40px_rgba(0,0,0,0.6)] transition-all duration-500 group backdrop-blur-3xl relative flex flex-col min-h-[420px]`}>
                                {/* Header banner with dynamic color */}
                                <div className={`h-[60px] w-full relative overflow-hidden ${isAdminRole ? 'bg-gradient-to-r from-[#5865F2]/40 to-black/80' : 'bg-gradient-to-r from-stone-900 to-black'}`}>
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                                    {isAdminRole && <div className="absolute top-0 right-0 w-32 h-32 bg-[#5865F2]/20 rounded-full blur-3xl pointer-events-none -mt-10 -mr-10"></div>}
                                    <div className="absolute bottom-2 right-4 flex gap-2 translate-y-8 group-hover:translate-y-0 transition-transform duration-300">
                                        <a href={`discord://-/users/${user.discord_id}`} className="p-1.5 rounded-lg bg-black/60 hover:bg-[#5865F2] text-white transition-colors border border-white/10" title="Discord Mention">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01a10.147 10.147 0 0 0 .372.292a.077.077 0 0 1-.009.128a12.98 12.98 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.086 2.157 2.419c0 1.334-.947 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.086 2.157 2.419c0 1.334-.946 2.419-2.157 2.419z" /></svg>
                                        </a>
                                    </div>
                                </div>

                                {/* Avatar */}
                                <div className={`absolute top-6 left-5 w-14 h-14 rounded-xl border ${isCurrentUser ? 'border-[#5865F2]' : 'border-white/10'} bg-[#0a0a0a] flex items-center justify-center shadow-2xl overflow-hidden z-20`}>
                                    <span className="text-3xl filter group-hover:brightness-125 transition-all">{isAdminRole ? '👑' : (isVerified ? '🗡️' : '🛡️')}</span>
                                </div>

                                <div className="pt-12 px-6 pb-6 flex-1 flex flex-col relative z-20">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-xl font-bold text-white tracking-tight truncate max-w-[160px]">
                                                    {user.display_name || "Unknown"}
                                                </h2>
                                                {isVerified && <span className="text-[#5865F2]" title="Identity Verified">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.64.304 1.24.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                </span>}
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase mb-2">Joined {joinDate}</p>
                                            <div className="flex gap-2 items-center flex-wrap">
                                                <span className={`text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded border ${isAdminRole ? 'bg-[#5865F2]/10 text-[#5865F2] border-[#5865F2]/30' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                                                    {user.role}
                                                </span>
                                                {isVerified ? (
                                                    <span className="text-[9px] uppercase tracking-widest font-black bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/30">Verified</span>
                                                ) : (
                                                    <span className="text-[9px] uppercase tracking-widest font-black bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/30">Dossier Incomplete</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Character Spotlight */}
                                    <div className="mt-4 mb-4">
                                        <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 font-mono">Primary Member</h3>
                                        {mainChar ? (
                                            <div className="bg-black/40 border border-[#c5a059]/20 rounded-lg p-2.5 shadow-inner group-hover:border-[#c5a059]/40 transition-colors">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded bg-black/60 border border-[#c5a059]/30 flex items-center justify-center text-xs">⭐</div>
                                                        <div>
                                                            <p className="text-xs font-bold text-white tracking-wide uppercase">{mainChar.name}</p>
                                                            <p className="text-[8px] text-[#c5a059] font-bold uppercase tracking-tighter font-mono">Main Verified</p>
                                                        </div>
                                                    </div>

                                                    {/* Agon Metrics Link */}
                                                    <a
                                                        href={`https://www.riseofagon.com/agonmetrics/pvp/player/${encodeURIComponent(mainChar.name)}/`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 rounded bg-blue-500/10 hover:bg-blue-500/30 text-blue-400 border border-blue-500/20 text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap"
                                                        title="View PvP Intel on Agon Metrics"
                                                    >
                                                        PvP Intel ↗
                                                    </a>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-black/40 border border-dashed border-white/10 rounded-lg p-2.5 text-center">
                                                <p className="text-[9px] text-gray-600 italic font-mono uppercase tracking-tighter">Identity Not Shared</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Alts List */}
                                    <div className="flex-1">
                                        <h3 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 font-mono">Database Tags</h3>
                                        <div className="flex flex-wrap gap-1">
                                            {user.Characters?.filter((c: any) => !c.is_main && c.is_visible && (!c.admin_only || isAdmin)).length > 0 ? (
                                                user.Characters
                                                    .filter((c: any) => !c.is_main && c.is_visible && (!c.admin_only || isAdmin))
                                                    .map((char: any) => (
                                                        <span key={char.id} className={`text-[10px] px-2 py-0.5 rounded border bg-black/40 border-white/5 text-gray-400 font-bold uppercase tracking-tighter ${char.admin_only ? 'text-amber-500 border-amber-500/30' : ''}`}>
                                                            {char.name}
                                                        </span>
                                                    ))
                                            ) : (
                                                <span className="text-[10px] text-stone-700 italic">None Registered</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Discord Action */}
                                    <div className="mt-4 pt-4 border-t border-white/5">
                                        <a
                                            href={`discord://-/users/${user.discord_id}`}
                                            className="block w-full text-center py-1.5 rounded-lg bg-[#5865F2]/5 hover:bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/20 text-[10px] font-bold uppercase tracking-widest transition-all"
                                        >
                                            Hail Member
                                        </a>
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
