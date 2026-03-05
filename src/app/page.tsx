"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchClanGoals, ClanGoal, getFeaturedProject, setFeaturedProject } from "./goals/actions";
import { getOnlineCount } from "./roster/actions";

export default function Home() {
  const { data: session, status } = useSession();
  const [greeting, setGreeting] = useState("Welcome");
  const [goalsStats, setGoalsStats] = useState({ total: 0, completed: 0 });
  const [onlineCount, setOnlineCount] = useState(0);
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
        const [data, projectData, onlineData] = await Promise.all([
          fetchClanGoals(),
          getFeaturedProject(),
          getOnlineCount()
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
        setOnlineCount(onlineData);
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
    // Skeleton loader replacing the spinner
    return (
      <div className="min-h-screen bg-[#0D1117] flex flex-col p-12 gap-6">
        <div className="w-1/3 h-12 bg-white/5 animate-pulse rounded-lg mb-4"></div>
        <div className="flex gap-4 mb-10">
          <div className="w-48 h-20 bg-white/5 animate-pulse rounded-xl"></div>
          <div className="w-48 h-20 bg-white/5 animate-pulse rounded-xl"></div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-32 bg-white/5 animate-pulse rounded-xl"></div>
          <div className="h-32 bg-white/5 animate-pulse rounded-xl"></div>
          <div className="h-32 bg-white/5 animate-pulse rounded-xl"></div>
          <div className="h-32 bg-white/5 animate-pulse rounded-xl"></div>
        </div>
      </div>
    );
  }

  const completionPercentage = goalsStats.total > 0 ? Math.round((goalsStats.completed / goalsStats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-transparent text-gray-300 font-sans selection:bg-[#5865F2]/30">

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-heading font-black text-white tracking-widest mb-2 drop-shadow-md">
              {greeting}, <span className="text-[#5865F2]">{session?.user?.name || "Operative"}</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl font-sans">
              Central command console. Your data feeds are currently synced and tracking live metrics.
            </p>
          </div>

          {/* Quick Stats - Post-Neumorphism style */}
          <div className="flex gap-4">
            <Link href="/goals" className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 transition-all group cursor-pointer duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 group-hover:bg-emerald-500/30 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)] inset-0">
                <svg className="w-6 h-6 text-emerald-400 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div className="pr-4">
                <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-0.5">Objectives</p>
                <p className="text-2xl font-bold text-white leading-none">{goalsStats.completed} <span className="text-sm text-gray-500 font-normal">/ {goalsStats.total}</span></p>
              </div>
            </Link>

            <Link href="/directory" className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-white/10 hover:border-[#5865F2]/50 hover:-translate-y-1 transition-all group cursor-pointer duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#5865F2]/20 flex items-center justify-center border border-[#5865F2]/30 relative shadow-[0_0_15px_rgba(88,101,242,0.2)]">
                <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0D1117] group-hover:border-[#5865F2]/50 animate-[pulse_2s_infinite]"></div>
                <svg className="w-6 h-6 text-[#5865F2] drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <div className="pr-2">
                <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-0.5">Members Logged In</p>
                <p className="text-2xl font-bold text-white leading-none">{onlineCount}</p>
              </div>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">

          {/* Base Card Template with Glassmorphism */}
          <Link href="/directory" className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 flex items-start gap-5">
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 group-hover:scale-110 transition-all shadow-inner">
              <span className="text-2xl drop-shadow-md">👥</span>
            </div>
            <div className="flex flex-col justify-center h-full z-10">
              <h2 className="text-xl font-bold text-white mb-1 tracking-tight">Member Roster</h2>
              <p className="text-gray-400 text-sm leading-relaxed">View active operatives, rank hierarchy, and registered database identities.</p>
            </div>
          </Link>

          {/* Card: Vault */}
          <Link href="/vault" className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-amber-500/30 hover:shadow-[0_8px_30px_rgb(245,158,11,0.1)] hover:-translate-y-1 transition-all duration-300 flex items-start gap-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-colors -mr-10 -mt-10"></div>
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-500/20 group-hover:scale-110 transition-all shadow-inner">
              <span className="text-2xl drop-shadow-md">💰</span>
            </div>
            <div className="flex flex-col justify-center h-full z-10">
              <h2 className="text-xl font-bold text-white mb-1 tracking-tight">Clan Vault</h2>
              <p className="text-gray-400 text-sm leading-relaxed">Monitor treasury goals, track collected logistics, and view high-value assets securely.</p>
            </div>
          </Link>

          {/* Card: Intel */}
          <Link href="/intel" className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-purple-500/30 hover:shadow-[0_8px_30px_rgb(168,85,247,0.1)] hover:-translate-y-1 transition-all duration-300 flex items-start gap-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors -mr-10 -mt-10"></div>
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500/20 group-hover:scale-110 transition-all shadow-inner">
              <span className="text-2xl drop-shadow-md">📜</span>
            </div>
            <div className="flex flex-col justify-center h-full z-10">
              <h2 className="text-xl font-bold text-white mb-1 tracking-tight">Submit Intel</h2>
              <p className="text-gray-400 text-sm leading-relaxed">Report enemy movements, document drops, and submit rapid tactical field updates.</p>
            </div>
          </Link>

          {/* Card: Map */}
          <Link href="/map" className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-emerald-500/30 hover:shadow-[0_8px_30px_rgb(16,185,129,0.1)] hover:-translate-y-1 transition-all duration-300 flex items-start gap-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors -mr-10 -mt-10"></div>
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all shadow-inner">
              <span className="text-2xl drop-shadow-md">🗺️</span>
            </div>
            <div className="flex flex-col justify-center h-full z-10">
              <h2 className="text-xl font-bold text-white mb-1 tracking-tight">Tactical Map</h2>
              <p className="text-gray-400 text-sm leading-relaxed">Access the interactive high-resolution map node layer for operational coordination.</p>
            </div>
          </Link>

          {/* Card: Database */}
          <Link href="/database" className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-[#5865F2]/30 hover:shadow-[0_8px_30px_rgba(88,101,242,0.1)] hover:-translate-y-1 transition-all duration-300 flex items-start gap-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#5865F2]/10 rounded-full blur-3xl group-hover:bg-[#5865F2]/20 transition-colors -mr-10 -mt-10"></div>
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-[#5865F2]/10 flex items-center justify-center border border-[#5865F2]/20 group-hover:bg-[#5865F2]/20 group-hover:scale-110 transition-all shadow-inner">
              <span className="text-2xl drop-shadow-md">📚</span>
            </div>
            <div className="flex flex-col justify-center h-full z-10">
              <h2 className="text-xl font-bold text-white mb-1 tracking-tight">Database</h2>
              <p className="text-gray-400 text-sm leading-relaxed">Query the entity matrix for monsters, item recipes, dungeons, and architecture.</p>
            </div>
          </Link>

          {/* Card: Marketplace */}
          <Link href="/bank-market" className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-orange-500/30 hover:shadow-[0_8px_30px_rgb(249,115,22,0.1)] hover:-translate-y-1 transition-all duration-300 flex items-start gap-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-colors -mr-10 -mt-10"></div>
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 group-hover:bg-orange-500/20 group-hover:scale-110 transition-all shadow-inner">
              <span className="text-2xl drop-shadow-md">⚖️</span>
            </div>
            <div className="flex flex-col justify-center h-full z-10">
              <h2 className="text-xl font-bold text-white mb-1 tracking-tight">Bank Market</h2>
              <p className="text-gray-400 text-sm leading-relaxed">Fulfil active operational buy and sell orders established by central treasury.</p>
            </div>
          </Link>

          {/* Card: Goals / Directives (Special Interactive Card) */}
          <div className="relative md:col-span-2 group mt-4">
            <Link href="/goals" className="block relative overflow-hidden bg-[#5865F2]/5 backdrop-blur-xl border border-[#5865F2]/20 rounded-2xl p-8 hover:bg-[#5865F2]/10 hover:border-[#5865F2]/50 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(88,101,242,0.2)] duration-300">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#5865F2]/10 rounded-full blur-[80px] group-hover:bg-[#5865F2]/20 transition-all duration-500 -mr-20 -mt-20 pointer-events-none"></div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 z-10 relative">
                <div className="flex items-start gap-6 flex-1">
                  <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-[#5865F2]/20 flex items-center justify-center border border-[#5865F2]/30 shadow-inner group-hover:scale-110 group-hover:bg-[#5865F2]/30 transition-all duration-300">
                    <span className="text-3xl drop-shadow-md">⚔️</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Active Directives</h2>
                    <p className="text-gray-400 text-sm max-w-md">View operational goals, track collective progression, and coordinate high-priority tasks.</p>
                  </div>
                </div>

                {/* Progress Bar Section inside the card */}
                <div className="w-full md:w-72 bg-black/40 p-5 rounded-xl border border-white/5 backdrop-blur-md">
                  <div className="flex justify-between items-end mb-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#5865F2] uppercase tracking-wider">Mission Status</span>
                      {featuredProject && <span className="text-[10px] font-bold text-white mt-1 border border-white/10 bg-white/5 px-2 py-1 rounded-md shadow-inner truncate max-w-[140px]">🎯 {featuredProject}</span>}
                    </div>
                    <span className="text-2xl font-black text-white">{completionPercentage}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 via-[#5865F2] to-indigo-400 transition-all duration-1000 ease-out relative"
                      style={{ width: `${completionPercentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enter Arrow Indicator */}
              <div className="absolute bottom-6 right-6 text-[#5865F2] opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                <svg className="w-8 h-8 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>
            </Link>

            {/* Admin Control */}
            {isAdmin && (
              <div className="absolute top-4 right-4 z-20 flex flex-col items-end">
                {isEditingProject ? (
                  <div className="bg-[#0D1117]/90 backdrop-blur-md border border-white/10 p-2 rounded-xl shadow-xl flex gap-2 animate-in fade-in zoom-in duration-200">
                    <select
                      value={newProjectName}
                      onChange={e => setNewProjectName(e.target.value)}
                      className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-[#5865F2] w-44 font-sans"
                    >
                      <option value="">Select Directive...</option>
                      {activeGoals.map(g => (
                        <option key={g.id} value={g.project_name || g.title}>
                          {g.project_name || g.title}
                        </option>
                      ))}
                    </select>
                    <button onClick={handleSaveProject} className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs px-3 py-1 rounded-lg font-bold transition-all shadow-md">Set</button>
                    <button onClick={() => setIsEditingProject(false)} className="bg-white/10 hover:bg-white/20 text-gray-300 text-xs px-3 py-1 rounded-lg transition-all">Del</button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.preventDefault(); setIsEditingProject(true); }}
                    className="opacity-0 group-hover:opacity-100 bg-[#0D1117]/80 hover:bg-[#5865F2]/20 border border-white/10 hover:border-[#5865F2]/50 text-gray-400 hover:text-[#5865F2] p-2 rounded-xl transition-all backdrop-blur-md shadow-lg cursor-pointer transform hover:scale-110"
                    title="Set Featured Project"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
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
