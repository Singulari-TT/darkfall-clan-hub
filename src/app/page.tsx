"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchClanGoals, ClanGoal, getFeaturedProject, setFeaturedProject } from "./goals/actions";

export default function Home() {
  const { data: session, status } = useSession();
  const [greeting, setGreeting] = useState("Welcome");
  const [goalsStats, setGoalsStats] = useState({ total: 0, completed: 0 });
  const [activeGoals, setActiveGoals] = useState<ClanGoal[]>([]);
  const [featuredProject, setFeaturedProjectState] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    // Fetch goals for the progress bar
    const loadDashboardData = async () => {
      try {
        const [data, projectData] = await Promise.all([
          fetchClanGoals(),
          getFeaturedProject()
        ]);

        const featured = projectData?.featuredProject || null;
        setFeaturedProjectState(featured);
        setIsAdmin(projectData?.isAdmin || false);
        setNewProjectName(featured || "");
        setActiveGoals(data.filter((g: ClanGoal) => g.status !== 'Completed'));

        // filter by featured project if one is set
        const relevantGoals = featured ? data.filter((g: ClanGoal) => g.project_name === featured || g.title === featured) : data;

        const completed = relevantGoals.filter((g: ClanGoal) => g.status === 'Completed').length;
        setGoalsStats({ total: relevantGoals.length, completed });
      } catch (e) {
        console.error("Failed to fetch dashboard stats");
      }
    };
    loadDashboardData();
  }, []);

  const handleSaveProject = async () => {
    try {
      await setFeaturedProject(newProjectName);
      setFeaturedProjectState(newProjectName || null);
      setIsEditingProject(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Failed to update featured project");
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen bg-[#0e0c10] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-[#c5a059] border-t-transparent animate-spin"></div></div>;
  }

  const completionPercentage = goalsStats.total > 0 ? Math.round((goalsStats.completed / goalsStats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-transparent text-gray-300 font-sans selection:bg-red-900/50">

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-amber-500 tracking-wider mb-2 drop-shadow-md">
              {greeting}, <span className="text-gray-100">{session?.user?.name || "Krew"}</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl font-serif italic">
              "Command center online. Coordinate tactical strikes and manage asset inventory."
            </p>
          </div>

          {/* Quick Stat */}
          <Link href="/goals" className="bg-[#1a151b]/80 border border-red-900/30 rounded-xl p-4 flex items-center gap-4 backdrop-blur-sm shadow-[0_4px_15px_rgba(0,0,0,0.5)] hover:border-red-500/50 transition-colors group cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-emerald-900/30 flex items-center justify-center border border-emerald-900/50 group-hover:bg-emerald-800/50 transition-colors">
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold font-heading tracking-widest uppercase group-hover:text-gray-300 transition-colors">Objectives Met</p>
              <p className="text-xl font-bold text-gray-100">{goalsStats.completed} <span className="text-sm text-gray-500 font-normal">/ {goalsStats.total}</span></p>
            </div>
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-5">

          {/* Card: Directory */}
          <Link href="/directory" className="group relative overflow-hidden bg-gradient-to-br from-[#1a151b] to-black border border-stone-800 rounded-lg p-6 hover:border-[#c5a059]/50 hover:shadow-[0_0_20px_rgba(197,160,89,0.1)] transition-all flex items-start gap-5">
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-stone-800 to-black flex items-center justify-center border border-stone-700 group-hover:border-[#c5a059] group-hover:scale-105 transition-all shadow-inner shadow-black">
              <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">👥</span>
            </div>
            <div className="flex flex-col justify-center h-full z-10">
              <h2 className="text-xl font-heading font-bold text-gray-200 mb-1 group-hover:text-[#c5a059] transition-colors tracking-widest uppercase">Member Roster</h2>
              <p className="text-stone-400 text-sm leading-relaxed">View active Krew members, roles, and registered characters. Verify allegiances.</p>
            </div>
          </Link>

          {/* Card: Vault */}
          <Link href="/vault" className="group relative overflow-hidden bg-gradient-to-br from-[#1a151b] to-black border border-amber-900/30 rounded-lg p-6 hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all flex items-start gap-5">
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-900/10 rounded-full blur-3xl group-hover:bg-amber-600/10 transition-colors -mr-10 -mt-10"></div>
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-amber-900/50 to-black flex items-center justify-center border border-amber-800/50 group-hover:border-amber-500 group-hover:scale-105 transition-all shadow-inner shadow-black">
              <span className="text-2xl">💰</span>
            </div>
            <div className="flex flex-col justify-center h-full z-10">
              <h2 className="text-xl font-heading font-bold text-gray-200 mb-1 group-hover:text-amber-400 transition-colors tracking-widest uppercase">Clan Vault</h2>
              <p className="text-stone-400 text-sm leading-relaxed">Monitor treasury goals, track collected logistics, and view high-value assets in the bank.</p>
            </div>
          </Link>

          {/* Card: Intel */}
          <Link href="/intel" className="group relative overflow-hidden bg-gradient-to-br from-[#1a151b] to-black border border-purple-900/30 rounded-lg p-6 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] transition-all flex items-start gap-5">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-900/10 rounded-full blur-3xl group-hover:bg-purple-600/10 transition-colors -mr-10 -mt-10"></div>
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-purple-900/50 to-black flex items-center justify-center border border-purple-800/50 group-hover:border-purple-500 group-hover:scale-105 transition-all shadow-inner shadow-black">
              <span className="text-2xl">📜</span>
            </div>
            <div className="flex flex-col justify-center h-full z-10">
              <h2 className="text-xl font-heading font-bold text-gray-200 mb-1 group-hover:text-purple-400 transition-colors tracking-widest uppercase">Submit Intel</h2>
              <p className="text-stone-400 text-sm leading-relaxed">Report enemy movements, document loot drops, and send rapid tactical updates.</p>
            </div>
          </Link>

          {/* Card: Map */}
          <Link href="/map" className="group relative overflow-hidden bg-gradient-to-br from-[#1a151b] to-black border border-emerald-900/30 rounded-lg p-6 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all flex items-start gap-5">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-900/10 rounded-full blur-3xl group-hover:bg-emerald-600/10 transition-colors -mr-10 -mt-10"></div>
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-900/50 to-black flex items-center justify-center border border-emerald-800/50 group-hover:border-emerald-500 group-hover:scale-105 transition-all shadow-inner shadow-black">
              <span className="text-2xl">🗺️</span>
            </div>
            <div className="flex flex-col justify-center h-full z-10">
              <h2 className="text-xl font-heading font-bold text-gray-200 mb-1 group-hover:text-emerald-400 transition-colors tracking-widest uppercase">Tactical Map</h2>
              <p className="text-stone-400 text-sm leading-relaxed">Access the interactive high-resolution map of Agon for strategic coordination.</p>
            </div>
          </Link>

          {/* Card: Database */}
          <Link href="/database" className="group relative overflow-hidden bg-gradient-to-br from-[#1a151b] to-black border border-blue-900/30 rounded-lg p-6 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all flex items-start gap-5">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-900/10 rounded-full blur-3xl group-hover:bg-blue-600/10 transition-colors -mr-10 -mt-10"></div>
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-blue-900/50 to-black flex items-center justify-center border border-blue-800/50 group-hover:border-blue-500 group-hover:scale-105 transition-all shadow-inner shadow-black">
              <span className="text-2xl">📚</span>
            </div>
            <div className="flex flex-col justify-center h-full z-10">
              <h2 className="text-xl font-heading font-bold text-gray-200 mb-1 group-hover:text-blue-400 transition-colors tracking-widest uppercase">Database</h2>
              <p className="text-stone-400 text-sm leading-relaxed">Search for monsters, crafting recipes, dungeons, and housing knowledge.</p>
            </div>
          </Link>

          {/* Card: Marketplace */}
          <Link href="/marketplace" className="group relative overflow-hidden bg-gradient-to-br from-[#1a151b] to-black border border-orange-900/30 rounded-lg p-6 hover:border-orange-500/50 hover:shadow-[0_0_20px_rgba(249,115,22,0.1)] transition-all flex items-start gap-5">
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-900/10 rounded-full blur-3xl group-hover:bg-orange-600/10 transition-colors -mr-10 -mt-10"></div>
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-orange-900/50 to-black flex items-center justify-center border border-orange-800/50 group-hover:border-orange-500 group-hover:scale-105 transition-all shadow-inner shadow-black">
              <span className="text-2xl">⚖️</span>
            </div>
            <div className="flex flex-col justify-center h-full z-10">
              <h2 className="text-xl font-heading font-bold text-gray-200 mb-1 group-hover:text-orange-400 transition-colors tracking-widest uppercase">Bank Market</h2>
              <p className="text-stone-400 text-sm leading-relaxed">Fulfil buy and sell orders established by the Clan Bank to support operations.</p>
            </div>
          </Link>

          {/* Card: Goals / Directives (Special Interactive Card) */}
          <div className="relative md:col-span-2 group">
            <Link href="/goals" className="block relative overflow-hidden bg-gradient-to-br from-[#8b0000]/20 to-black border border-red-900/50 rounded-lg p-8 hover:border-red-600 transition-all shadow-[0_4px_20px_rgba(139,0,0,0.2)] hover:shadow-[0_0_40px_rgba(139,0,0,0.4)]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-900/10 rounded-full blur-3xl group-hover:bg-red-700/20 transition-colors -mr-20 -mt-20 pointer-events-none"></div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 z-10 relative">
                <div className="flex items-start gap-5 flex-1">
                  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-red-800 to-black flex items-center justify-center border-2 border-[#c5a059]/50 shadow-[0_0_15px_rgba(197,160,89,0.3)] group-hover:scale-105 group-hover:border-[#c5a059] transition-all">
                    <span className="text-3xl drop-shadow-md">⚔️</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-[#c5a059] mb-1 tracking-widest uppercase">Clan Directives</h2>
                    <p className="text-stone-400 text-sm max-w-md font-serif italic">"View open operational goals, track progression, and coordinate clan-wide objectives in real-time."</p>
                  </div>
                </div>

                {/* Progress Bar Section inside the card */}
                <div className="w-full md:w-64 bg-black/60 p-4 rounded-lg border border-red-900/30 backdrop-blur-sm">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-heading uppercase tracking-widest font-bold text-[#c5a059]">Objective Status</span>
                      {featuredProject && <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 mt-1 truncate max-w-[140px] border border-red-900/50 bg-red-950/30 px-1.5 py-0.5 rounded shadow-inner">🎯 {featuredProject}</span>}
                    </div>
                    <span className="text-xl font-heading font-black text-gray-100">{completionPercentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#1a151b] rounded-full overflow-hidden border border-red-900/20">
                    <div
                      className="h-full bg-gradient-to-r from-red-900 via-red-600 to-[#c5a059] transition-all duration-1000 ease-out relative"
                      style={{ width: `${completionPercentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white/10 animate-[pulse_2s_infinite]"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enter Arrow Indicator */}
              <div className="absolute bottom-6 right-6 text-[#c5a059] opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                <svg className="w-8 h-8 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>
            </Link>

            {/* Admin Control */}
            {isAdmin && (
              <div className="absolute top-4 right-4 z-20 flex flex-col items-end">
                {isEditingProject ? (
                  <div className="bg-[#1a151b] border border-red-900/50 p-2 rounded-lg shadow-xl shadow-black flex gap-2 animate-in fade-in zoom-in duration-200">
                    <select
                      value={newProjectName}
                      onChange={e => setNewProjectName(e.target.value)}
                      className="bg-black border border-stone-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-red-500 w-44 font-sans custom-scrollbar"
                    >
                      <option value="">Select Directive...</option>
                      {activeGoals.map(g => (
                        <option key={g.id} value={g.project_name || g.title}>
                          {g.project_name || g.title}
                        </option>
                      ))}
                    </select>
                    <button onClick={handleSaveProject} className="bg-red-900/80 hover:bg-red-700 border border-red-800 text-white text-xs px-2 rounded font-bold transition-colors">Set</button>
                    <button onClick={() => setIsEditingProject(false)} className="bg-stone-900 hover:bg-stone-800 text-stone-400 text-xs px-2 rounded transition-colors">Del</button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.preventDefault(); setIsEditingProject(true); }}
                    className="opacity-0 group-hover:opacity-100 bg-[#1a151b]/80 hover:bg-red-900 border border-red-900/30 hover:border-red-500 text-stone-400 hover:text-white p-2 rounded-lg transition-all backdrop-blur-sm shadow-lg cursor-pointer transform hover:scale-110"
                    title="Set Featured Project"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
