"use client";

import { useState } from "react";
import InteractiveMap from "@/components/InteractiveMap";
import WarRoomIntro from "@/components/WarRoomIntro";

export default function MapPage() {
    const [hasEntered, setHasEntered] = useState(false);

    return (
        <div className="min-h-screen bg-transparent p-4 font-sans relative">
            {!hasEntered && <WarRoomIntro onEnter={() => setHasEntered(true)} />}

            {/* We can still mount the map in the background so it loads while Intro plays */}
            <div className={`transition-opacity duration-1000 ${hasEntered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="max-w-[1600px] mx-auto">
                    <section className="bg-transparent rounded-2xl relative overflow-hidden">
                        <InteractiveMap />
                    </section>
                </div>
            </div>
        </div>
    );
}
