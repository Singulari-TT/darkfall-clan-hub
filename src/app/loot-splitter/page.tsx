"use client";
import { useState, useEffect, useCallback } from "react";

interface Player {
    id: string;
    name: string;
}

interface PlayerRoll {
    playerId: number;
    roll: number;
}

interface Item {
    id: string;
    name: string;
    quantity: number;
    valuePerUnit: number;
    rolls?: PlayerRoll[]; // New property for storing the dice rolls
}

export default function LootSplitter() {
    const [partySize, setPartySize] = useState<number>(1);
    const [items, setItems] = useState<Item[]>([{ id: '1', name: '', quantity: 1, valuePerUnit: 0 }]);
    const [rawGold, setRawGold] = useState<number>(0);
    const [isScanning, setIsScanning] = useState(false);
    const [scanMessage, setScanMessage] = useState<string | null>(null);
    const [partyNames, setPartyNames] = useState<string[]>(Array(15).fill("").map((_, i) => `Player ${i + 1}`));

    const addItem = () => setItems([...items, { id: Math.random().toString(), name: '', quantity: 1, valuePerUnit: 0 }]);
    const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
    const updateItem = (id: string, field: keyof Item, value: any) => setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));

    const handleRollDice = (itemId: string) => {
        const newRolls: PlayerRoll[] = [];
        for (let i = 1; i <= partySize; i++) {
            newRolls.push({ playerId: i, roll: Math.floor(Math.random() * 100) + 1 });
        }
        updateItem(itemId, 'rolls', newRolls);
    };

    const updatePartyName = (index: number, name: string) => {
        const newNames = [...partyNames];
        newNames[index] = name;
        setPartyNames(newNames);
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        const itemsList = e.clipboardData?.items;
        if (!itemsList) return;

        let imageFile = null;
        for (let i = 0; i < itemsList.length; i++) {
            if (itemsList[i].type.indexOf('image') !== -1) {
                imageFile = itemsList[i].getAsFile();
                break;
            }
        }

        if (!imageFile) return;

        setIsScanning(true);
        setScanMessage("A.I. Neural Vision analyzing item grid...");

        try {
            const base64 = await new Promise<string>((resolve, reject) => {
                const r = new FileReader();
                r.onloadend = () => {
                    if (r.result) resolve(r.result as string);
                    else reject(new Error("Failed to read file"));
                };
                r.readAsDataURL(imageFile as Blob);
            });

            const res = await fetch('/api/loot-vision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64 })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to analyze image");
            }

            // Map API response to UI state
            const detectedItems: Item[] = data.items.map((apiItem: any) => ({
                id: Math.random().toString(),
                name: apiItem.name || "Unknown Item",
                quantity: apiItem.quantity || 1,
                valuePerUnit: apiItem.valuePerUnit || 0
            }));

            // Separate raw gold from generic items if the AI found it
            const goldItemIndex = detectedItems.findIndex(i => i.name.toLowerCase().includes("gold"));
            if (goldItemIndex !== -1) {
                setRawGold(prev => prev + detectedItems[goldItemIndex].quantity);
                detectedItems.splice(goldItemIndex, 1);
            }

            setItems(prev => [...prev, ...detectedItems]);
            setScanMessage(null);

        } catch (err: any) {
            console.error("Vision API Error:", err);
            setScanMessage(`Error: ${err.message}`);
            // Auto clear error message
            setTimeout(() => setScanMessage(null), 5000);
        } finally {
            setIsScanning(false);
        }
    };

    useEffect(() => {
        const handleGlobalPaste = async (e: ClipboardEvent) => {
            // Only fire if there's actually an image in the clipboard
            const hasImage = Array.from(e.clipboardData?.items || []).some(i => i.type.startsWith('image'));
            if (!hasImage) return;
            // Don't fire if an input or textarea is focused (user is typing)
            const focused = document.activeElement;
            if (focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement) return;
            if (!e.clipboardData) return;

            const fakeReactEvent = {
                clipboardData: e.clipboardData,
            } as unknown as React.ClipboardEvent;

            handlePaste(fakeReactEvent);
        };

        window.addEventListener('paste', handleGlobalPaste);
        return () => window.removeEventListener('paste', handleGlobalPaste);
    }, []);

    const totalItemValue = items.reduce((acc, item) => acc + (item.quantity * item.valuePerUnit), 0);
    const totalPool = totalItemValue + rawGold;

    const splitPerPlayer = partySize > 0 ? Math.floor(totalPool / partySize) : 0;

    return (
        <div className="min-h-screen bg-transparent text-gray-300 p-4 sm:p-8 font-sans selection:bg-social-cobalt-dim">
            <div className="max-w-6xl mx-auto space-y-8 relative z-10">
                <header className="border-b border-surface-border pb-6">
                    <h1 className="text-4xl md:text-5xl font-black font-heading text-white tracking-widest mb-2 drop-shadow-md">
                        Loot Splitter <span className="text-social-cobalt">Module</span>
                    </h1>
                    <p className="text-gray-400 font-sans text-lg">Instant, calculation-free division of spoils for the operative party.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Input Forms */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Party & Quick Setup */}
                        <div className="bg-surface border border-surface-border rounded-card p-6 backdrop-blur-[--blur-glass] shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                    <span className="text-social-cobalt">👥</span> Party Configuration
                                </h2>
                            </div>
                            <div className="flex bg-black/40 border border-surface-border rounded-xl p-4 items-center justify-between mb-6">
                                <span className="text-gray-400 font-bold uppercase tracking-wider text-sm">Total Party Members:</span>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setPartySize(Math.max(1, partySize - 1))} className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-surface-border text-xl font-bold flex items-center justify-center transition-all">-</button>
                                    <span className="text-3xl font-black text-white w-12 text-center">{partySize}</span>
                                    <button onClick={() => setPartySize(Math.min(15, partySize + 1))} className="w-10 h-10 rounded-lg bg-social-cobalt-dim hover:bg-social-cobalt-dim*2 border border-social-cobalt-border text-social-cobalt hover:text-white text-xl font-bold flex items-center justify-center transition-all">+</button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Party Roster (Optional Names)</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                    {Array.from({ length: partySize }).map((_, i) => (
                                        <div key={i} className="space-y-1">
                                            <label className="text-[9px] text-gray-600 font-bold uppercase block px-1">P{i + 1}</label>
                                            <input
                                                type="text"
                                                value={partyNames[i]}
                                                onChange={(e) => updatePartyName(i, e.target.value)}
                                                className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-social-cobalt-border transition-colors"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Image OCR Dropzone Component */}
                        <div
                            className={`bg-surface border ${isScanning ? 'border-social-cobalt shadow-[0_0_20px_rgba(88,101,242,0.3)]' : 'border-surface-border'} border-dashed rounded-card p-8 backdrop-blur-[--blur-glass] text-center group hover:bg-surface-hover hover:border-social-cobalt-border transition-all focus-within:border-social-cobalt outline-none relative cursor-pointer`}
                            onPaste={handlePaste}
                            tabIndex={0}
                        >
                            {isScanning ? (
                                <div className="flex flex-col items-center justify-center space-y-4 py-4">
                                    <div className="w-12 h-12 rounded-full border-4 border-social-cobalt border-t-transparent animate-spin mx-auto"></div>
                                    <p className="text-social-cobalt font-bold tracking-widest uppercase text-xs animate-pulse">{scanMessage}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="w-16 h-16 mx-auto bg-social-cobalt-dim rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-social-cobalt-dim*2 transition-all">
                                        <span className="text-3xl">📸</span>
                                    </div>
                                    <h3 className="text-white font-bold text-lg mb-2">Paste Loot Screenshot (Click and CTRL+V)</h3>
                                    <p className="text-gray-400 text-sm">Let our A.I Neural Engine instantly identify items and quantities.</p>
                                    {scanMessage && (
                                        <p className="mt-4 text-red-400 bg-red-950/50 inline-block px-4 py-2 rounded-lg text-xs font-bold font-mono tracking-tight shadow-md">
                                            {scanMessage}
                                        </p>
                                    )}

                                    {/* Invisible actual input for click fallback */}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                const fakeEvent = {
                                                    clipboardData: {
                                                        items: [
                                                            { type: e.target.files[0].type, getAsFile: () => e.target.files![0] }
                                                        ]
                                                    }
                                                } as unknown as React.ClipboardEvent;
                                                handlePaste(fakeEvent);
                                            }
                                        }}
                                    />
                                </>
                            )}
                        </div>

                        {/* Loot Section */}
                        <div className="bg-surface border border-surface-border rounded-card p-6 backdrop-blur-[--blur-glass] shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                            <div className="flex justify-between items-center mb-6 border-b border-surface-border pb-4">
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
                                        <div className="flex-1 min-w-[200px] bg-black/40 border border-surface-border rounded-lg flex items-center px-3 focus-within:border-social-cobalt-border transition-colors">
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                                placeholder="Item Name"
                                                className="bg-transparent border-none outline-none text-white w-full py-2 placeholder-gray-600 font-sans"
                                            />
                                        </div>
                                        <div className="w-24 bg-black/40 border border-surface-border rounded-lg flex flex-col px-2 py-1 focus-within:border-social-cobalt-border transition-colors">
                                            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Qty</span>
                                            <input
                                                type="number"
                                                value={item.quantity || ''}
                                                onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                                className="bg-transparent border-none outline-none text-white w-full font-mono text-sm"
                                            />
                                        </div>
                                        <div className="w-32 bg-black/40 border border-surface-border rounded-lg flex flex-col px-2 py-1 focus-within:border-amber-500/50 transition-colors">
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
                            <div className="mt-4 pt-4 border-t border-surface-border">
                                <button onClick={addItem} className="bg-social-cobalt-dim hover:bg-social-cobalt-dim*2 border border-social-cobalt-border text-social-cobalt hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm w-full sm:w-auto">
                                    + Add Item
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Breakdown */}
                    <div className="lg:col-span-1">
                        <div className="bg-surface backdrop-blur-[--blur-glass] border border-surface-border rounded-card p-6 sticky top-24 shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
                            <h2 className="text-xl font-bold text-white tracking-tight mb-6 border-b border-surface-border pb-4">
                                Distribution Ledger
                            </h2>

                            {/* Split Mechanics */}
                            <div className="space-y-4 mb-6 text-sm">
                                {items.length === 0 && rawGold === 0 ? (
                                    <div className="text-gray-500 italic text-center py-8">Awaiting operational assets...</div>
                                ) : (
                                    items.map((item) => {
                                        const splitAmount = partySize > 0 ? Math.floor(item.quantity / partySize) : 0;
                                        const remainder = partySize > 0 ? item.quantity % partySize : 0;

                                        // Visual highlight for the highest dice roll winner
                                        let maxRoll = 0;
                                        if (item.rolls && item.rolls.length > 0) {
                                            maxRoll = Math.max(...item.rolls.map(r => r.roll));
                                        }

                                        return (
                                            <div key={item.id} className="bg-black/40 border border-white/5 rounded-lg p-3">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-gray-300 font-bold">{item.quantity}x {item.name}</span>
                                                    <button
                                                        onClick={() => handleRollDice(item.id)}
                                                        className="text-xs bg-indigo-500/10 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded transition-colors flex items-center gap-1"
                                                    >
                                                        🎲 Roll
                                                    </button>
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-500 border-t border-white/5 pt-2">
                                                    <span>Divide: <strong className="text-indigo-400 font-mono text-sm ml-1">{splitAmount}</strong> each</span>
                                                    {remainder > 0 && <span>Remainder: <strong className="text-orange-400 font-mono text-sm ml-1">{remainder}</strong></span>}
                                                </div>

                                                {/* Render Dice Results Inline */}
                                                {item.rolls && item.rolls.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
                                                        {item.rolls.map(r => (
                                                            <div key={r.playerId} className={`text-[10px] px-2 py-1 flex items-center gap-1 font-mono rounded ${r.roll === maxRoll ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                                                                <span className="opacity-50">{(partyNames[r.playerId - 1] || `P${r.playerId}`).split(' ')[0]}:</span> {r.roll}
                                                                {r.roll === maxRoll && <span className="text-[10px]">⭐</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Total Asset Value:</span>
                                <span className="text-amber-500 font-mono">{totalItemValue.toLocaleString()} g</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Raw Gold:</span>
                                <span className="text-amber-500 font-mono">{rawGold.toLocaleString()} g</span>
                            </div>
                            {/* Financial Cut Header */}
                            {totalPool > 0 && (
                                <>
                                    <div className="flex justify-between items-center pt-4 border-t border-surface-border mb-4">
                                        <span className="text-white font-bold uppercase tracking-wider text-sm">Gross Yield:</span>
                                        <span className="text-amber-400 font-bold font-mono text-xl drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">{totalPool.toLocaleString()} g</span>
                                    </div>
                                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-center shadow-inner relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all -mr-10 -mt-10"></div>
                                        <p className="text-xs text-amber-500/80 font-bold uppercase tracking-widest mb-2 relative z-10">Individual Cut (Gold Equiv)</p>
                                        <p className="text-4xl font-black text-amber-400 font-mono drop-shadow-lg relative z-10">
                                            {splitPerPlayer.toLocaleString()} <span className="text-xl text-amber-600">g</span>
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
