"use client";

import { useState, useEffect } from "react";
import { Loader2, Github, ExternalLink, Star, Code, Calendar, Globe, Database } from "lucide-react";

interface RepoItem {
    id: string;
    platform: 'github' | 'gitlab' | 'bitbucket';
    name: string;
    fullName: string;
    description: string;
    url: string;
    stars: number;
    language: string | null;
    updatedAt: string;
    owner: string;
    avatar: string;
}

const PlatformIcon = ({ platform }: { platform: RepoItem['platform'] }) => {
    switch (platform) {
        case 'github': return <Github className="w-4 h-4 text-white" />;
        case 'gitlab': return <Globe className="w-4 h-4 text-orange-500" />;
        case 'bitbucket': return <Database className="w-4 h-4 text-blue-500" />;
        default: return <Code className="w-4 h-4 text-gray-400" />;
    }
};

const PlatformBadge = ({ platform }: { platform: RepoItem['platform'] }) => {
    const colors = {
        github: 'bg-white/10 text-white',
        gitlab: 'bg-orange-500/10 text-orange-500',
        bitbucket: 'bg-blue-500/10 text-blue-500',
    };
    return (
        <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${colors[platform]}`}>
            {platform}
        </span>
    );
};

export default function CodeWatcherFeed() {
    const [repos, setRepos] = useState<RepoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchRepos() {
            setLoading(true);
            try {
                const res = await fetch('/api/intel/code-watch');
                const json = await res.json();
                if (json.success) {
                    setRepos(json.data);
                } else {
                    setError(json.error || "Uplink Failed");
                }
            } catch (err) {
                setError("Signal Lost");
            } finally {
                setLoading(false);
            }
        }
        fetchRepos();
        const interval = setInterval(fetchRepos, 3600000); // Hourly pulse
        return () => clearInterval(interval);
    }, []);

    if (loading && repos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500 font-mono animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin text-[#5865F2]" />
                <span className="text-[10px] tracking-[0.3em] uppercase">Aggregating Global Repositories...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-red-500/50 font-mono">
                <Globe className="w-12 h-12" />
                <span className="text-xs uppercase tracking-widest font-bold">{error}</span>
                <p className="text-[9px] text-gray-600 uppercase">Network handshake failed across multiple nodes.</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-widest uppercase flex items-center gap-3">
                        <Globe className="text-[#5865F2]" />
                        Global <span className="text-[#5865F2]">Darkfall Code Watch</span>
                    </h2>
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-1">
                        Sourcing: GitHub / GitLab / Bitbucket Public Archives
                    </p>
                </div>
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {repos.length} Directives Synchronized
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {repos.map((repo) => (
                        <a
                            key={repo.id}
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block bg-black/40 border border-white/5 rounded-2xl p-5 hover:border-[#5865F2]/50 hover:bg-[#5865F2]/5 transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <img src={repo.avatar} alt={repo.owner} className="w-8 h-8 rounded-lg border border-white/10" />
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-bold text-white truncate group-hover:text-[#5865F2] tracking-tight">{repo.name}</h3>
                                        <p className="text-[9px] text-gray-500 font-mono uppercase truncate italic">@{repo.owner}</p>
                                    </div>
                                </div>
                                <PlatformBadge platform={repo.platform} />
                            </div>

                            <p className="text-xs text-gray-400 mb-6 line-clamp-2 h-8 leading-relaxed">
                                {repo.description || "No tactical description available for this repository."}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                                        <Star className="w-3 h-3 text-amber-500/50" />
                                        <span>{repo.stars}</span>
                                    </div>
                                    {repo.language && (
                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase font-mono tracking-tighter">
                                            <Code className="w-3 h-3 text-emerald-500/50" />
                                            <span>{repo.language}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-[9px] text-gray-600 font-mono uppercase">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(repo.updatedAt).toLocaleDateString()}
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center text-[9px] text-gray-600 uppercase tracking-widest font-mono">
                <span>Multi-Vector Uplink: Active</span>
                <span className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#5865F2] shadow-[0_0_5px_rgba(88,101,242,0.5)]"></div>
                    Sync Status: 100%
                </span>
            </div>
        </div>
    );
}
