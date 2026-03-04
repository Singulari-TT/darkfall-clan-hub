"use client";

import { useState, useEffect } from "react";

export default function WarRoomIntro({ onEnter }: { onEnter: () => void }) {
    const [isFading, setIsFading] = useState(false);
    const [pulse, setPulse] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => setPulse(p => !p), 2000);
        return () => clearInterval(interval);
    }, []);

    const handleEnter = () => {
        setIsFading(true);
        setTimeout(() => {
            onEnter();
        }, 1200); // Wait for the zoom-in and fade-out animation to complete
    };

    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gray-950 transition-all duration-[1200ms] ease-in-out
                ${isFading ? "opacity-0 scale-150 pointer-events-none" : "opacity-100 scale-100"}
            `}
        >
            {/* Background Map Overlay (Simulated Command Desk) */}
            <div
                className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay"
                style={{ backgroundImage: "url('/images/map/master_map.jpg')" }}
            />

            {/* Radar Scan Effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
                <div className={`w-[800px] h-[800px] rounded-full border border-emerald-500/10 shadow-[0_0_100px_rgba(16,185,129,0.1)] transition-transform duration-1000 ${pulse ? 'scale-110' : 'scale-90'}`}></div>
                <div className={`absolute w-[400px] h-[400px] rounded-full border border-emerald-500/20 shadow-[0_0_80px_rgba(16,185,129,0.2)] transition-transform duration-1000 delay-150 ${pulse ? 'scale-110' : 'scale-90'}`}></div>
                <div className={`absolute w-[150px] h-[150px] rounded-full border border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.4)] transition-transform duration-1000 delay-300 ${pulse ? 'scale-110' : 'scale-90'}`}></div>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-8 p-12 bg-gray-950/40 backdrop-blur-md rounded-3xl border border-gray-800 shadow-2xl">
                {/* Emblem / Title */}
                <div>
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 via-rose-500 to-orange-600 drop-shadow-lg tracking-widest uppercase">
                        War Room
                    </h1>
                    <p className="text-gray-400 mt-4 tracking-[0.3em] uppercase text-sm font-semibold">
                        Tactical Command & Control Interface
                    </p>
                </div>

                {/* Secure Login Scan UI */}
                <div className="py-6 w-full px-12 border-y border-gray-800/50 bg-gray-900/50">
                    <div className="flex justify-between text-xs text-gray-500 font-mono mb-2">
                        <span>ESTABLISHING SECURE UPLINK...</span>
                        <span className="text-emerald-500 font-bold ml-4">AUTH OK</span>
                    </div>
                </div>

                <button
                    onClick={handleEnter}
                    disabled={isFading}
                    className="relative group overflow-hidden px-10 py-4 bg-transparent text-emerald-400 font-bold tracking-widest uppercase border border-emerald-500/50 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all duration-300"
                >
                    <span className="relative z-10 group-hover:text-gray-900 transition-colors duration-300">
                        Access Terminal
                    </span>
                    <div className="absolute inset-0 bg-emerald-500 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                </button>
            </div>
        </div>
    );
}
