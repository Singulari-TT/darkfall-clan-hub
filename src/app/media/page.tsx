"use client";

import { useEffect, useState } from "react";

export interface YouTubeVideo {
    id: { videoId: string };
    snippet: {
        title: string;
        description: string;
        channelTitle: string;
        publishedAt: string;
        thumbnails: {
            high: { url: string };
            medium: { url: string };
        };
    };
}

export default function MediaPipeline() {
    const [videos, setVideos] = useState<YouTubeVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const res = await fetch('/api/youtube');
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Failed to fetch media.");
                }

                setVideos(data.items || []);
            } catch (err: any) {
                console.error(err);
                setError(err.message);

                // Provide some fallback empty data so the UI can still be seen
                setVideos([]);
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, []);

    return (
        <div className="min-h-screen bg-transparent text-gray-300 p-4 sm:p-8 font-sans selection:bg-red-900/50">
            <div className="max-w-7xl mx-auto space-y-8 relative z-10">
                <header className="border-b border-red-900/40 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-[#c5a059] tracking-widest uppercase mb-2 drop-shadow-md">
                            Media Pipeline
                        </h1>
                        <p className="text-gray-400 font-serif italic text-lg">
                            Watch the latest "Rise of Agon" videos from the community. Automatically updated via YouTube.
                        </p>
                    </div>
                </header>

                {error && (
                    <div className="bg-red-950/50 border border-red-900 text-red-400 p-4 rounded-lg flex items-start gap-4 shadow-lg">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <h3 className="font-bold uppercase tracking-widest text-sm mb-1">Pipeline Error</h3>
                            <p className="text-sm">
                                {error}
                            </p>
                            {error.includes('YOUTUBE_API_KEY') && (
                                <p className="text-xs text-red-300 mt-2 font-mono">
                                    To fix this, add YOUTUBE_API_KEY=your_key_here to the .env.local file.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 rounded-full border-4 border-[#c5a059] border-t-transparent animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {videos.length > 0 ? (
                            videos.map((video) => (
                                <div key={video.id.videoId} className="bg-[#1a151b]/80 border border-red-900/30 rounded-xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.5)] hover:border-red-500/50 transition-all group flex flex-col">
                                    <div className="relative aspect-video bg-black cursor-pointer overflow-hidden group">
                                        <img
                                            src={video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url}
                                            alt={video.snippet.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                                        />
                                        <a
                                            href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <div className="w-16 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
                                                <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                                            </div>
                                        </a>
                                    </div>
                                    <div className="p-5 flex flex-col flex-1">
                                        <h2 className="text-lg font-bold text-gray-100 line-clamp-2 mb-2 group-hover:text-[#c5a059] transition-colors leading-tight">
                                            {video.snippet.title}
                                        </h2>
                                        <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-1">
                                            {video.snippet.description}
                                        </p>
                                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-stone-500 border-t border-red-900/20 pt-4 mt-auto">
                                            <span className="text-[#c5a059] truncate max-w-[120px]">{video.snippet.channelTitle}</span>
                                            <span>{new Date(video.snippet.publishedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            !error && (
                                <div className="col-span-full py-16 flex justify-center">
                                    <div className="bg-[#1a151b]/80 border border-red-900/30 rounded-xl p-8 text-center max-w-md backdrop-blur-sm">
                                        <p className="text-gray-400 font-serif italic mb-2">No intelligence found in the pipeline right now.</p>
                                        <p className="text-xs text-[#c5a059] uppercase tracking-widest font-bold font-heading">Check back later</p>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
