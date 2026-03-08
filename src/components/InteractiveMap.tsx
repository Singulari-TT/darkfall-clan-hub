"use client";

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { useWarRoomChannel, MapMarker } from '@/hooks/useWarRoomChannel';
import { createMapMarker, deleteMapMarker, fetchMapMarkers } from '@/app/map/actions';
import { useSession } from 'next-auth/react';

// Dynamically import Leaflet map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });
const ImageOverlay = dynamic(() => import('react-leaflet').then((mod) => mod.ImageOverlay), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then((mod) => mod.Polyline), { ssr: false });

// We import the hooks standard since they'll only be executed inside the dynamically loaded MapContainer which is client-only.
import { useMapEvents, useMap } from 'react-leaflet';

// Helper to handle map clicks and freehand drawing
const MapEventSetup = ({
    onMapClick,
    onMapMove,
    isDrawingMode,
    onDrawStart,
    onDrawMove,
    onDrawEnd
}: {
    onMapClick: (e: any) => void;
    onMapMove: (e: any) => void;
    isDrawingMode: boolean;
    onDrawStart: (lat: number, lng: number) => void;
    onDrawMove: (lat: number, lng: number) => void;
    onDrawEnd: () => void;
}) => {
    const map = useMap();

    // Disable map dragging when in draw mode
    useEffect(() => {
        if (isDrawingMode) {
            map.dragging.disable();
        } else {
            map.dragging.enable();
        }
    }, [isDrawingMode, map]);

    useMapEvents({
        click(e) {
            if (!isDrawingMode) onMapClick(e);
        },
        mousedown(e) {
            if (isDrawingMode) onDrawStart(e.latlng.lat, e.latlng.lng);
        },
        mousemove(e) {
            onMapMove(e); // always track the cursor for other users
            if (isDrawingMode) onDrawMove(e.latlng.lat, e.latlng.lng);
        },
        mouseup(e) {
            if (isDrawingMode) onDrawEnd();
        }
    });
    return null;
};

// Custom Icon Generator
const getCustomIcon = (type: string) => {
    if (typeof window === 'undefined') return null;
    const L = require('leaflet');

    if (type.startsWith('icon://')) {
        const filename = type.replace('icon://', '');
        return L.icon({
            iconUrl: `/images/icons/${filename}`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            className: 'custom-leaflet-icon shadow-[0_0_10px_rgba(0,0,0,0.5)] rounded-full border border-gray-700 bg-gray-900 cursor-pointer hover:scale-125 transition-transform'
        });
    }

    let colorClass = 'bg-gray-500';
    let iconChar = 'M';

    if (type === 'attack') { colorClass = 'bg-rose-500'; iconChar = '⚔'; }
    if (type === 'defend') { colorClass = 'bg-blue-500'; iconChar = '🛡'; }
    if (type === 'rally') { colorClass = 'bg-emerald-500'; iconChar = '★'; }

    return L.divIcon({
        className: 'custom-leaflet-icon',
        html: `<div class="w-8 h-8 ${colorClass} text-white rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.5)] border-2 border-white font-bold text-lg cursor-pointer hover:scale-110 transition-transform">${iconChar}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16], // center
    });
};

type DrawingStroke = { color: string, points: [number, number][] };

export default function InteractiveMap() {
    const { data: session } = useSession();
    const [isMounted, setIsMounted] = useState(false);
    const [dbMarkers, setDbMarkers] = useState<MapMarker[]>([]);

    // Icon Palette State
    const [availableIcons, setAvailableIcons] = useState<string[]>([]);
    const [showIconPalette, setShowIconPalette] = useState(false);

    // UI State for selected marker tool
    const [selectedTool, setSelectedTool] = useState<string | null>(null);

    // Freehand Drawing State
    const [isDrawingProcess, setIsDrawingProcess] = useState(false);
    const [currentLine, setCurrentLine] = useState<[number, number][]>([]);
    const [lines, setLines] = useState<DrawingStroke[]>([]); // Local drawn lines with colors
    const [drawingColor, setDrawingColor] = useState('#d946ef'); // default fuchsia

    // Initialize real-time channel
    const {
        activeUsers,
        markers: liveMarkers,
        broadcastNewMarker,
        broadcastDeleteMarker,
        broadcastCursorMove
    } = useWarRoomChannel(dbMarkers);

    useEffect(() => {
        setIsMounted(true);
        // Fetch initial persistent markers
        fetchMapMarkers().then(data => {
            if (data) setDbMarkers(data as MapMarker[]);
        });

        // Fetch available custom icons
        fetch('/api/icons').then(res => res.json()).then(data => {
            if (data.icons) setAvailableIcons(data.icons);
        }).catch(err => console.error(err));

        if (typeof window !== 'undefined') {
            const L = require('leaflet');
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default,
                iconUrl: require('leaflet/dist/images/marker-icon.png').default,
                shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
            });
        }
    }, []);

    const handleMapClick = async (e: any) => {
        // Only run for tactical icons, ignore if drawing mode or no user
        if (!selectedTool || selectedTool === 'draw' || !session?.user) return;

        const { lat, lng } = e.latlng;
        // Optimistic UI could be handled here or inside broadcastNewMarker
        try {
            // 1. Save to DB
            const newDbMarker = await createMapMarker(selectedTool, lat, lng);
            // 2. Broadcast to other connected clients
            await broadcastNewMarker(newDbMarker);
            // Deselect tool
            setSelectedTool(null);
        } catch (error) {
            console.error("Failed to place marker", error);
        }
    };

    const handleDeleteMarker = async (id: string, creatorId: string) => {
        if (session?.user?.id !== creatorId) return; // Only creators can delete
        try {
            await deleteMapMarker(id);
            await broadcastDeleteMarker(id);
        } catch (error) {
            console.error("Failed to delete marker", error);
        }
    };

    // Throttle cursor movements
    const [lastMove, setLastMove] = useState(0);
    const handleMapMove = useCallback((e: any) => {
        const now = Date.now();
        if (now - lastMove > 100) { // Broadcast every 100ms max
            broadcastCursorMove(e.latlng.lat, e.latlng.lng);
            setLastMove(now);
        }
    }, [lastMove, broadcastCursorMove]);


    // Drawing Handlers
    const handleDrawStart = (lat: number, lng: number) => {
        setIsDrawingProcess(true);
        setCurrentLine([[lat, lng]]);
    };

    const handleDrawMove = (lat: number, lng: number) => {
        if (!isDrawingProcess) return;
        setCurrentLine(prev => [...prev, [lat, lng]]);
    };

    const handleDrawEnd = () => {
        if (!isDrawingProcess) return;
        setIsDrawingProcess(false);
        if (currentLine.length > 1) {
            setLines(prev => [...prev, { color: drawingColor, points: currentLine }]); // Save finalized stroke
        }
        setCurrentLine([]);
    };

    const clearDrawings = () => {
        setLines([]);
        setCurrentLine([]);
    };

    const handleUndo = () => {
        setLines(prev => prev.slice(0, -1));
    };


    if (!isMounted) return <div className="h-[600px] w-full bg-gray-900 animate-pulse rounded-2xl flex items-center justify-center text-gray-500">Loading Tactical Interface...</div>;

    // The bounds for our 8000x8000 master_map
    const width = 8000;
    const height = 8000;
    const bounds: [[number, number], [number, number]] = [[0, 0], [height, width]];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[750px] font-sans">
            {/* Sidebar Controls */}
            <div className="col-span-1 flex flex-col gap-4 order-last lg:order-first h-full overflow-y-auto pr-2 custom-scrollbar">

                {/* Info Panel */}
                <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-[#5865F2] animate-ping"></span>
                        <span className="text-[#5865F2]">War Room</span> Live
                    </h2>
                    <p className="text-xs text-gray-400 font-mono">Command and Conquer Coordination</p>
                </div>

                {/* Tactical Tools */}
                <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl flex-1">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Tactical Orders</h3>
                    <div className="flex flex-col gap-2">
                        {[
                            { id: 'attack', icon: '⚔', label: 'Attack', color: 'hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 text-gray-400', active: 'bg-rose-500/20 text-rose-400 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]' },
                            { id: 'defend', icon: '🛡', label: 'Defend', color: 'hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30 text-gray-400', active: 'bg-blue-500/20 text-blue-400 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' },
                            { id: 'rally', icon: '★', label: 'Rally', color: 'hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 text-gray-400', active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' },
                            { id: 'draw', icon: '✎', label: 'Draw on Map', color: 'hover:bg-fuchsia-500/10 hover:text-fuchsia-400 hover:border-fuchsia-500/30 text-gray-400', active: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.2)]' }
                        ].map(tool => (
                            <button
                                key={tool.id}
                                onClick={() => setSelectedTool(selectedTool === tool.id ? null : tool.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all border font-bold text-sm tracking-wide w-full text-left
                                    ${selectedTool === tool.id ? tool.active : `border-white/5 bg-white/5 ${tool.color}`}`}
                            >
                                <span className="text-xl w-6 text-center">{tool.icon}</span>
                                <span className="flex-1">{tool.label}</span>
                                {selectedTool === tool.id && <span className="text-[10px] uppercase tracking-widest text-white bg-white/20 px-2 py-0.5 rounded-md">Active</span>}
                            </button>
                        ))}
                    </div>
                    {selectedTool === 'draw' && (
                        <div className="mt-4 p-4 bg-white/5 border border-fuchsia-500/20 rounded-xl">
                            <h4 className="text-xs text-gray-400 font-bold mb-3 uppercase tracking-widest">Marker Color</h4>
                            <div className="flex gap-2">
                                {['#d946ef', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ffffff'].map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setDrawingColor(color)}
                                        className={`w-7 h-7 rounded-full border-2 transition-transform shadow-inner ${drawingColor === color ? 'scale-125 border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent hover:scale-110'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={handleUndo}
                                    disabled={lines.length === 0}
                                    className="flex-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-xs font-bold py-2 rounded-lg transition-colors text-gray-300 border border-white/5 uppercase tracking-widest"
                                >
                                    ↩ Undo
                                </button>
                                <button
                                    onClick={clearDrawings}
                                    disabled={lines.length === 0}
                                    className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-50 text-xs font-bold py-2 rounded-lg transition-colors text-rose-400 border border-rose-500/20 uppercase tracking-widest"
                                >
                                    🗑️ Clear All
                                </button>
                            </div>
                        </div>
                    )}

                    {selectedTool && selectedTool !== 'draw' && (
                        <div className="mt-4 p-3 bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-xl text-center">
                            <p className="text-xs text-[#5865F2] font-bold tracking-widest uppercase">
                                Click map to place {selectedTool.replace('icon://', '')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Asset Markers Palette Removed per User Request */}

                {/* Active Presence */}
                <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                        Tactical Presence
                        <span className="bg-[#5865F2]/20 text-[#5865F2] px-2 py-0.5 rounded-md border border-[#5865F2]/30 text-[10px]">{activeUsers.length}</span>
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {activeUsers.map(user => (
                            <div key={user.userId} className="relative group/user">
                                {user.image ? (
                                    <img
                                        src={user.image}
                                        alt={user.name}
                                        className="w-10 h-10 rounded-full border-2 border-[#5865F2]/50 shadow-[0_0_10px_rgba(88,101,242,0.3)] group-hover/user:scale-110 transition-transform cursor-help"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full border-2 border-gray-700 bg-gray-900 flex items-center justify-center text-xs font-bold text-gray-500 group-hover/user:scale-110 transition-transform cursor-help">
                                        {user.name.charAt(0)}
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full animate-pulse shadow-sm" />

                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 border border-white/10 rounded text-[9px] font-bold text-white uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/user:opacity-100 transition-opacity pointer-events-none z-50">
                                    {user.name}
                                </div>
                            </div>
                        ))}
                        {activeUsers.length === 0 && <div className="text-gray-600 font-mono text-[10px] uppercase tracking-widest w-full text-center py-2">Solo mission</div>}
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="col-span-1 lg:col-span-3 rounded-2xl overflow-hidden border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.3)] relative bg-[#0a0f18] h-[500px] lg:h-full">
                <MapContainer
                    center={[height / 2, width / 2]}
                    zoom={1}
                    minZoom={0}
                    maxZoom={4}
                    style={{ height: '100%', width: '100%', backgroundColor: '#0a0f18' }}
                    crs={typeof window !== 'undefined' ? require('leaflet').CRS.Simple : undefined}
                    className={selectedTool === 'draw' ? 'cursor-crosshair' : ''}
                >
                    <MapEventSetup
                        onMapClick={handleMapClick}
                        onMapMove={handleMapMove}
                        isDrawingMode={selectedTool === 'draw'}
                        onDrawStart={handleDrawStart}
                        onDrawMove={handleDrawMove}
                        onDrawEnd={handleDrawEnd}
                    />

                    {/* 
                  IMPORTANT: Next.js doesn't natively handle bounds inside ImageOverlay seamlessly unless wrapped.
                  We use straightforward passing to standard ImageOverlay.
                */}
                    <ImageOverlay
                        url="/images/map/master_map.jpg"
                        bounds={bounds}
                    />

                    {/* Render Drawn Lines (Local Session) */}
                    {lines.map((stroke, idx) => (
                        <Polyline
                            key={idx}
                            positions={stroke.points as any}
                            pathOptions={{ color: stroke.color, weight: 4, lineCap: 'round', lineJoin: 'round' }}
                        />
                    ))}
                    {currentLine.length > 0 && (
                        <Polyline
                            positions={currentLine as any}
                            pathOptions={{ color: drawingColor, weight: 4, lineCap: 'round', lineJoin: 'round' }}
                        />
                    )}

                    {/* Render All Synchronized Markers */}
                    {liveMarkers.map((marker) => {
                        const icon = getCustomIcon(marker.type);
                        if (!icon) return null;

                        return (
                            <Marker
                                key={marker.id}
                                position={[marker.lat, marker.lng]}
                                icon={icon as any} // Leaflet types can be tricky with custom html
                            >
                                <Popup className="custom-popup">
                                    <div className="p-1">
                                        <p className="font-bold uppercase tracking-wider text-xs mb-1 text-gray-800">Tactical Command</p>
                                        <p className="text-sm mb-3">Type: <span className="font-semibold">{marker.type}</span></p>

                                        {/* Enable delete if the current user created it */}
                                        {session?.user?.id === marker.created_by && (
                                            <button
                                                onClick={() => handleDeleteMarker(marker.id, marker.created_by)}
                                                className="w-full text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 py-1.5 px-3 rounded shadow-sm transition-colors"
                                            >
                                                Remove Marker
                                            </button>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    })}
                </MapContainer>
            </div>
        </div>
    );
}
