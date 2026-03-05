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
    const [players, setPlayers] = useState<Player[]>([{ id: '1', name: '' }]);
    const [items, setItems] = useState<Item[]>([{ id: '1', name: '', quantity: 1, valuePerUnit: 0 }]);
    const [rawGold, setRawGold] = useState<number>(0);

    const addPlayer = () => setPlayers([...players, { id: Math.random().toString(), name: '' }]);
    const removePlayer = (id: string) => setPlayers(players.filter(p => p.id !== id));
    const updatePlayer = (id: string, name: string) => setPlayers(players.map(p => p.id === id ? { ...p, name } : p));

    const addItem = () => setItems([...items, { id: Math.random().toString(), name: '', quantity: 1, valuePerUnit: 0 }]);
    const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
    const updateItem = (id: string, field: keyof Item, value: any) => setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));

    const totalItemValue = items.reduce((acc, item) => acc + (item.quantity * item.valuePerUnit), 0);
    const totalPool = totalItemValue + rawGold;

    const validPlayers = players.filter(p => p.name.trim() !== '');
    const splitPerPlayer = validPlayers.length > 0 ? Math.floor(totalPool / validPlayers.length) : 0;

    return (
        <div className="min-h-screen bg-transparent text-gray-300 p-4 sm:p-8 font-sans selection:bg-red-900/50">
            <div className="max-w-6xl mx-auto space-y-8 relative z-10">
                <header className="border-b border-red-900/40 pb-6">
                    <h1 className="text-4xl md:text-5xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-[#c5a059] tracking-widest uppercase mb-2 drop-shadow-md">
                        Loot Splitter
                    </h1>
                    <p className="text-gray-400 font-serif italic text-lg">Divide the spoils of war evenly among the participating Dreadkrew.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Input Forms */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Players Section */}
                        <div className="bg-[#1a151b]/80 border border-red-900/30 rounded-xl p-6 backdrop-blur-sm shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-heading font-black text-white tracking-widest uppercase flex items-center gap-2">
                                    <span className="text-blue-500">👥</span> Participants
                                </h2>
                                <button onClick={addPlayer} className="bg-blue-900/30 hover:bg-blue-800/50 border border-blue-900/50 text-blue-400 hover:text-white px-3 py-1 rounded text-sm uppercase font-bold tracking-wider transition-colors">
                                    + Add Member
                                </button>
                            </div>
                            <div className="space-y-3">
                                {players.map((player, index) => (
                                    <div key={player.id} className="flex gap-3">
                                        <div className="flex-1 bg-black/50 border border-stone-800 rounded flex items-center px-3 focus-within:border-blue-500/50 transition-colors">
                                            <span className="text-stone-500 text-sm w-6">{index + 1}.</span>
                                            <input
                                                type="text"
                                                value={player.name}
                                                onChange={(e) => updatePlayer(player.id, e.target.value)}
                                                placeholder="Player Name"
                                                className="bg-transparent border-none outline-none text-white w-full py-2 placeholder-stone-600"
                                            />
                                        </div>
                                        {players.length > 1 && (
                                            <button onClick={() => removePlayer(player.id)} className="w-10 flex items-center justify-center bg-red-950/40 border border-red-900/40 text-red-500 hover:bg-red-900/80 hover:text-white rounded transition-colors">
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Loot Section */}
                        <div className="bg-[#1a151b]/80 border border-red-900/30 rounded-xl p-6 backdrop-blur-sm shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
                            <div className="flex justify-between items-center mb-6 border-b border-red-900/20 pb-4">
                                <h2 className="text-xl font-heading font-black text-white tracking-widest uppercase flex items-center gap-2">
                                    <span className="text-amber-500">💰</span> The Spoils
                                </h2>
                                <div className="flex items-center gap-3">
                                    <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Raw Gold:</label>
                                    <input
                                        type="number"
                                        value={rawGold || ''}
                                        onChange={(e) => setRawGold(parseInt(e.target.value) || 0)}
                                        className="bg-black/50 border border-amber-900/50 rounded w-32 px-3 py-1.5 text-amber-500 font-bold outline-none focus:border-amber-500 text-right"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div key={item.id} className="flex gap-3 items-start flex-wrap sm:flex-nowrap">
                                        <div className="flex-1 min-w-[200px] bg-black/50 border border-stone-800 rounded flex items-center px-3 focus-within:border-[#c5a059]/50 transition-colors">
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                                placeholder="Item Name"
                                                className="bg-transparent border-none outline-none text-white w-full py-2 placeholder-stone-600"
                                            />
                                        </div>
                                        <div className="w-24 bg-black/50 border border-stone-800 rounded flex flex-col px-2 py-1 focus-within:border-[#c5a059]/50">
                                            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Qty</span>
                                            <input
                                                type="number"
                                                value={item.quantity || ''}
                                                onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                                className="bg-transparent border-none outline-none text-white w-full font-mono text-sm"
                                            />
                                        </div>
                                        <div className="w-32 bg-black/50 border border-stone-800 rounded flex flex-col px-2 py-1 focus-within:border-[#c5a059]/50">
                                            <span className="text-[9px] uppercase tracking-widest text-amber-500/70 font-bold">Value Each</span>
                                            <input
                                                type="number"
                                                value={item.valuePerUnit || ''}
                                                onChange={(e) => updateItem(item.id, 'valuePerUnit', parseInt(e.target.value) || 0)}
                                                className="bg-transparent border-none outline-none text-amber-400 w-full font-mono text-sm"
                                            />
                                        </div>
                                        {items.length > 1 && (
                                            <button onClick={() => removeItem(item.id)} className="w-10 h-[46px] flex items-center justify-center bg-red-950/40 border border-red-900/40 text-red-500 hover:bg-red-900/80 hover:text-white rounded transition-colors shrink-0">
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-stone-800">
                                <button onClick={addItem} className="bg-[#c5a059]/20 hover:bg-[#c5a059]/40 border border-[#c5a059]/50 text-[#c5a059] hover:text-white px-4 py-2 rounded text-sm uppercase font-bold tracking-wider transition-colors w-full sm:w-auto">
                                    + Add Item
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Breakdown */}
                    <div className="lg:col-span-1">
                        <div className="bg-gradient-to-br from-[#1a151b] to-black border border-[#c5a059]/30 rounded-xl p-6 sticky top-24 shadow-[0_0_20px_rgba(197,160,89,0.1)]">
                            <h2 className="text-xl font-heading font-black text-center text-[#c5a059] tracking-widest uppercase mb-6 border-b border-[#c5a059]/20 pb-4">
                                Final Split
                            </h2>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Total Valid Players:</span>
                                    <span className="text-white font-bold">{validPlayers.length}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Items Value:</span>
                                    <span className="text-amber-500 font-mono">{totalItemValue.toLocaleString()} g</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Raw Gold:</span>
                                    <span className="text-amber-500 font-mono">{rawGold.toLocaleString()} g</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-stone-800">
                                    <span className="text-gray-300 font-bold uppercase tracking-wider">Total Pool:</span>
                                    <span className="text-amber-400 font-bold font-mono text-lg">{totalPool.toLocaleString()} g</span>
                                </div>
                            </div>

                            <div className="bg-amber-950/30 border border-amber-900/50 rounded-lg p-6 text-center transform hover:scale-105 transition-transform cursor-default">
                                <p className="text-xs text-amber-500/80 font-bold uppercase tracking-widest mb-2 font-heading">Each Player Receives</p>
                                <p className="text-4xl font-black text-amber-400 font-mono drop-shadow-md">
                                    {splitPerPlayer.toLocaleString()} <span className="text-xl text-amber-600">g</span>
                                </p>
                            </div>

                            {validPlayers.length > 0 && totalPool > 0 && (
                                <div className="mt-8">
                                    <h3 className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-3 border-b border-stone-800 pb-2">Cut Breakdown</h3>
                                    <ul className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                        {validPlayers.map((p, i) => (
                                            <li key={i} className="flex justify-between items-center text-sm bg-black/40 px-3 py-2 rounded border border-stone-800/50">
                                                <span className="text-gray-300 truncate pr-4">{p.name}</span>
                                                <span className="text-amber-500 font-mono shrink-0">{splitPerPlayer.toLocaleString()} g</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
