"use client";

import { useState } from "react";

interface Player {
    id: string;
    name: string;
}

interface Item {
    id: string;
    name: string;
    quantity: number;
    valuePerUnit: number;
}

export default function LootSplitter() {
    const [partySize, setPartySize] = useState<number>(1);
    const [items, setItems] = useState<Item[]>([{ id: '1', name: '', quantity: 1, valuePerUnit: 0 }]);
    const [rawGold, setRawGold] = useState<number>(0);

    const addItem = () => setItems([...items, { id: Math.random().toString(), name: '', quantity: 1, valuePerUnit: 0 }]);
    const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
    const updateItem = (id: string, field: keyof Item, value: any) => setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));

    const totalItemValue = items.reduce((acc, item) => acc + (item.quantity * item.valuePerUnit), 0);
    const totalPool = totalItemValue + rawGold;

    const splitPerPlayer = partySize > 0 ? Math.floor(totalPool / partySize) : 0;

    return (
        <div className="min-h-screen bg-transparent text-gray-300 p-4 sm:p-8 font-sans selection:bg-[#5865F2]/30">
            <div className="max-w-6xl mx-auto space-y-8 relative z-10">
                <header className="border-b border-white/10 pb-6">
                    <h1 className="text-4xl md:text-5xl font-black font-heading text-white tracking-widest mb-2 drop-shadow-md">
                        Loot Splitter <span className="text-[#5865F2]">Module</span>
                    </h1>
                    <p className="text-gray-400 font-sans text-lg">Instant, calculation-free division of spoils for the operative party.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Input Forms */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Party & Quick Setup */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                    <span className="text-[#5865F2]">👥</span> Party Configuration
                                </h2>
                            </div>
                            <div className="flex bg-black/40 border border-white/10 rounded-xl p-4 items-center justify-between">
                                <span className="text-gray-400 font-bold uppercase tracking-wider text-sm">Total Party Members:</span>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setPartySize(Math.max(1, partySize - 1))} className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xl font-bold flex items-center justify-center transition-all">-</button>
                                    <span className="text-3xl font-black text-white w-12 text-center">{partySize}</span>
                                    <button onClick={() => setPartySize(partySize + 1)} className="w-10 h-10 rounded-lg bg-[#5865F2]/20 hover:bg-[#5865F2]/40 border border-[#5865F2]/30 text-[#5865F2] hover:text-white text-xl font-bold flex items-center justify-center transition-all">+</button>
                                </div>
                            </div>
                        </div>

                        {/* Image OCR Dropzone Placeholder */}
                        <div className="bg-white/5 border border-white/10 border-dashed rounded-2xl p-8 backdrop-blur-xl text-center group hover:bg-white/10 hover:border-[#5865F2]/50 transition-all cursor-pointer">
                            <div className="w-16 h-16 mx-auto bg-[#5865F2]/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#5865F2]/20 transition-all">
                                <span className="text-3xl">📸</span>
                            </div>
                            <h3 className="text-white font-bold text-lg mb-2">Paste Loot Screenshot (OCR Beta)</h3>
                            <p className="text-gray-400 text-sm">Ctrl+V your inventory image here to automatically parse items and values. Building neural link...</p>
                        </div>

                        {/* Loot Section */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                    <span className="text-amber-500">💰</span> Acquired Assets
                                </h2>
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Raw Gold:</label>
                                    <input
                                        type="number"
                                        value={rawGold || ''}
                                        onChange={(e) => setRawGold(parseInt(e.target.value) || 0)}
                                        className="bg-black/40 border border-amber-500/30 rounded-lg w-32 px-3 py-1.5 text-amber-500 font-bold outline-none focus:border-amber-500 text-right transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div key={item.id} className="flex gap-3 items-start flex-wrap sm:flex-nowrap group">
                                        <div className="flex-1 min-w-[200px] bg-black/40 border border-white/10 rounded-lg flex items-center px-3 focus-within:border-[#5865F2]/50 transition-colors">
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                                placeholder="Item Name"
                                                className="bg-transparent border-none outline-none text-white w-full py-2 placeholder-gray-600 font-sans"
                                            />
                                        </div>
                                        <div className="w-24 bg-black/40 border border-white/10 rounded-lg flex flex-col px-2 py-1 focus-within:border-[#5865F2]/50 transition-colors">
                                            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Qty</span>
                                            <input
                                                type="number"
                                                value={item.quantity || ''}
                                                onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                                className="bg-transparent border-none outline-none text-white w-full font-mono text-sm"
                                            />
                                        </div>
                                        <div className="w-32 bg-black/40 border border-white/10 rounded-lg flex flex-col px-2 py-1 focus-within:border-amber-500/50 transition-colors">
                                            <span className="text-[9px] uppercase tracking-widest text-amber-500/70 font-bold">Value Each</span>
                                            <input
                                                type="number"
                                                value={item.valuePerUnit || ''}
                                                onChange={(e) => updateItem(item.id, 'valuePerUnit', parseInt(e.target.value) || 0)}
                                                className="bg-transparent border-none outline-none text-amber-400 w-full font-mono text-sm"
                                            />
                                        </div>
                                        {items.length > 1 && (
                                            <button onClick={() => removeItem(item.id)} className="w-10 h-[46px] flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg transition-colors shrink-0 opacity-0 group-hover:opacity-100">
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <button onClick={addItem} className="bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 text-[#5865F2] hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm w-full sm:w-auto">
                                    + Add Item
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Breakdown */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 sticky top-24 shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
                            <h2 className="text-xl font-bold text-white tracking-tight mb-6 border-b border-white/10 pb-4">
                                Distribution Summary
                            </h2>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Party Size:</span>
                                    <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded-md">{partySize}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Total Asset Value:</span>
                                    <span className="text-amber-500 font-mono">{totalItemValue.toLocaleString()} g</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Raw Gold:</span>
                                    <span className="text-amber-500 font-mono">{rawGold.toLocaleString()} g</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                    <span className="text-white font-bold uppercase tracking-wider">Gross Yield:</span>
                                    <span className="text-amber-400 font-bold font-mono text-xl drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">{totalPool.toLocaleString()} g</span>
                                </div>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-center shadow-inner relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all -mr-10 -mt-10"></div>
                                <p className="text-xs text-amber-500/80 font-bold uppercase tracking-widest mb-2 relative z-10">Individual Cut</p>
                                <p className="text-4xl font-black text-amber-400 font-mono drop-shadow-lg relative z-10">
                                    {splitPerPlayer.toLocaleString()} <span className="text-xl text-amber-600">g</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
