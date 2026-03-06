"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Zap } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const ImageOverlay = dynamic(() => import('react-leaflet').then((mod) => mod.ImageOverlay), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then((mod) => mod.CircleMarker), { ssr: false });

export default function TacticalHeatmap() {
    const [ganks, setGanks] = useState<[number, number, number][]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchHeatmap() {
            try {
                const res = await fetch('/api/agon/heatmap');
                const data = await res.json();
                if (data.success) {
                    setGanks(data.ganks);
                } else {
                    setError("Failed to pull heat signatures.");
                }
            } catch (err) {
                setError("Neural uplink failure.");
            } finally {
                setLoading(false);
            }
        }
        fetchHeatmap();
    }, []);

    if (loading) {
        return (
            <div className="h-full w-full bg-[#0a0f18] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-red-500" />
                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Scanning Global Heat Signatures...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full w-full bg-[#0a0f18] flex flex-col items-center justify-center gap-4 text-red-500">
                <span className="text-sm font-bold uppercase tracking-widest">{error}</span>
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-500/10 border border-red-500/50 rounded text-xs uppercase font-bold">Retry Handshake</button>
            </div>
        );
    }

    // Map bounds (matched to InteractiveMap)
    const width = 8000;
    const height = 8000;
    const bounds: [[number, number], [number, number]] = [[0, 0], [height, width]];

    // Transform Agon Metrics coordinates to Map coordinates
    // Rise of Agon world is roughly centered at 0,0 with ~5000 unit radius.
    // We map -5000...5000 to 0...8000.
    const transformCoords = (lat: number, lng: number): [number, number] => {
        const x = (lng + 5000) * (width / 10000);
        const y = (lat + 5000) * (height / 10000);
        return [y, x]; // Leaflet uses [lat, lng] which is [y, x] in our pixel space
    };

    return (
        <div className="h-full w-full relative group">
            <div className="absolute top-6 left-6 z-20 pointer-events-none">
                <div className="bg-black/80 backdrop-blur-xl border border-red-500/30 p-4 rounded-2xl shadow-2xl">
                    <h2 className="text-xl font-black text-white tracking-widest uppercase flex items-center gap-2">
                        <Zap className="text-red-500 animate-pulse" />
                        Live Gank Density
                    </h2>
                    <p className="text-[10px] text-gray-400 font-mono uppercase mt-1">Global Intelligence / Active Conflict Zones</p>
                    <div className="flex items-center gap-4 mt-4 text-[9px] font-bold uppercase tracking-tighter">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500/40 border border-red-500"></div> Low Threat</div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500/80 border border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div> High Volume</div>
                    </div>
                </div>
            </div>

            <div className="h-full w-full rounded-2xl overflow-hidden border border-white/5 bg-black">
                <MapContainer
                    center={[height / 2, width / 2]}
                    zoom={1}
                    minZoom={0}
                    maxZoom={4}
                    style={{ height: '100%', width: '100%', backgroundColor: '#000' }}
                    crs={typeof window !== 'undefined' ? (require('leaflet')).CRS.Simple : undefined}
                >
                    <ImageOverlay url="/images/map/master_map.jpg" bounds={bounds} />

                    {ganks.map((point, i) => {
                        const [originalLat, originalLng, weight] = point;
                        const transformed = transformCoords(originalLat, originalLng);

                        return (
                            <CircleMarker
                                key={i}
                                center={transformed}
                                radius={4}
                                pathOptions={{
                                    fillColor: '#ef4444',
                                    fillOpacity: 0.15 + (weight * 0.5),
                                    color: 'transparent',
                                    stroke: false
                                }}
                            />
                        );
                    })}
                </MapContainer>
            </div>

            <div className="absolute bottom-6 right-6 z-20 bg-black/60 border border-white/10 px-3 py-1.5 rounded-lg text-[9px] text-gray-500 font-mono italic">
                {ganks.length} Conflict Signals Detected
            </div>
        </div>
    );
}
