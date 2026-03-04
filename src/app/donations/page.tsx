"use client";

import { useState, useEffect } from "react";
import { fetchLedgerEntries, addLedgerEntry, LedgerEntry } from "./actions";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function DonationsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Form state
    const [itemName, setItemName] = useState("");
    const [quantity, setQuantity] = useState<number | "">("");
    const [source, setSource] = useState("");

    // @ts-ignore - session.user is extended with role, but TS might not know it
    const role = session?.user?.role;

    useEffect(() => {
        if (status === "loading") return;

        if (!session || !['Admin', 'Leader', 'Officer'].includes(role)) {
            router.push("/");
            return;
        }

        loadEntries();
    }, [session, status, role, router]);

    const loadEntries = async () => {
        setIsLoading(true);
        const data = await fetchLedgerEntries();
        setEntries(data);
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!itemName.trim() || quantity === "" || quantity === 0) {
            setMessage({ type: "error", text: "Item Name and a non-zero Quantity are required." });
            return;
        }

        setIsSubmitting(true);
        try {
            await addLedgerEntry(itemName.trim(), Number(quantity), source.trim());
            setMessage({ type: "success", text: "Ledger entry successfully recorded." });

            // Clear form
            setItemName("");
            setQuantity("");
            setSource("");

            // Reload table
            await loadEntries();
        } catch (error: any) {
            setMessage({ type: "error", text: error.message || "Failed to log entry." });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === "loading" || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center -mt-16 text-red-500 font-heading tracking-widest uppercase">
                Accessing Secure Vault Archives...
            </div>
        );
    }

    if (!['Admin', 'Leader', 'Officer'].includes(role)) return null;

    return (
        <div className="min-h-screen bg-transparent text-gray-200 p-4 sm:p-8 font-sans selection:bg-red-900/50">
            <div className="max-w-7xl mx-auto space-y-8 relative z-10">

                <header className="border-b border-red-900/40 pb-6">
                    <h1 className="text-4xl md:text-5xl font-heading font-black bg-gradient-to-r from-red-600 to-[#c5a059] text-transparent bg-clip-text drop-shadow-sm uppercase tracking-wider mb-2">
                        Clan Bank Ledger
                    </h1>
                    <p className="text-gray-400 font-serif italic text-lg shadow-black">Log manual donations, withdrawals, and resource movements.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Log New Entry Form */}
                    <div className="lg:col-span-1 bg-[#1a151b]/95 border border-red-900/30 rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-sm relative overflow-hidden sticky top-24">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#c5a059] to-transparent opacity-50"></div>

                        <h2 className="text-xl font-heading font-bold text-[#c5a059] mb-6 tracking-wide uppercase border-b border-red-900/30 pb-3">
                            Record Transaction
                        </h2>

                        {message && (
                            <div className={`p-4 mb-6 rounded border font-bold text-sm tracking-wide ${message.type === 'success' ? 'bg-emerald-900/20 border-emerald-900/50 text-emerald-400' : 'bg-red-900/20 border-red-900/50 text-red-500'}`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Material / Item Name</label>
                                <input
                                    type="text"
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    placeholder="e.g. Iron Ingot, Platinum..."
                                    className="w-full bg-[#0e0c10] border border-red-900/40 rounded px-4 py-3 text-gray-200 focus:border-[#c5a059] outline-none transition-colors font-serif italic"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Quantity (In / Out)</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || "")}
                                    placeholder="+5000 (Donation) / -100 (Withdrawal)"
                                    className="w-full bg-[#0e0c10] border border-red-900/40 rounded px-4 py-3 text-[#c5a059] focus:border-[#c5a059] outline-none transition-colors font-mono tracking-wider font-bold"
                                    required
                                />
                                <p className="text-[10px] text-stone-500 mt-1 uppercase tracking-wider">Use positive numbers for deposits/donations and negative for withdrawals.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Source / Destination (Optional)</label>
                                <input
                                    type="text"
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                    placeholder="e.g. Donated by KrewMember2..."
                                    className="w-full bg-[#0e0c10] border border-red-900/40 rounded px-4 py-3 text-gray-400 focus:border-[#c5a059] outline-none transition-colors font-serif italic"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full py-3 mt-4 rounded font-heading font-black uppercase tracking-widest transition-all text-sm border 
                                    ${isSubmitting
                                        ? 'bg-black/50 text-gray-600 border-red-900/20 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-[#8B6508]/80 to-[#1a151b] hover:from-[#c5a059] text-white border-[#c5a059]/50 hover:border-[#c5a059] shadow-[0_0_15px_rgba(197,160,89,0.2)]'
                                    }`}
                            >
                                {isSubmitting ? 'Recording...' : 'Complete Ledger Entry'}
                            </button>
                        </form>
                    </div>

                    {/* Historical Ledger */}
                    <div className="lg:col-span-2">
                        <div className="bg-[#1a151b]/95 border border-red-900/30 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-sm overflow-hidden min-h-[500px]">
                            <div className="p-6 border-b border-red-900/30 flex justify-between items-center bg-black/40">
                                <h2 className="text-xl font-heading font-bold text-gray-200 tracking-wide uppercase">
                                    Official Archives
                                </h2>
                                <span className="text-xs font-mono text-stone-500 bg-black py-1 px-3 border border-red-900/40 rounded-full">
                                    {entries.length} Records found
                                </span>
                            </div>

                            {entries.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center justify-center opacity-50">
                                    <span className="text-6xl mb-4">📜</span>
                                    <h3 className="text-lg font-heading font-bold text-gray-300">The Ledger is Empty</h3>
                                    <p className="text-sm font-serif italic text-stone-500 mt-2">No manual bank transactions have been recorded yet.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-black/60 border-b border-red-900/50">
                                                <th className="px-6 py-4 text-xs font-bold font-heading text-[#c5a059] uppercase tracking-widest">Date</th>
                                                <th className="px-6 py-4 text-xs font-bold font-heading text-[#c5a059] uppercase tracking-widest">Material</th>
                                                <th className="px-6 py-4 text-xs font-bold font-heading text-[#c5a059] uppercase tracking-widest text-right">Qty</th>
                                                <th className="px-6 py-4 text-xs font-bold font-heading text-[#c5a059] uppercase tracking-widest">Source / Note</th>
                                                <th className="px-6 py-4 text-xs font-bold font-heading text-[#c5a059] uppercase tracking-widest text-right">Logged By</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-red-900/20">
                                            {entries.map((entry) => (
                                                <tr key={entry.id} className="hover:bg-red-900/10 transition-colors group">
                                                    <td className="px-6 py-4 text-sm font-mono text-stone-400 whitespace-nowrap">
                                                        {new Date(entry.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-gray-200">
                                                        {entry.item_name}
                                                    </td>
                                                    <td className={`px-6 py-4 text-sm font-mono font-bold text-right ${entry.quantity > 0 ? 'text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]' : 'text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.3)]'}`}>
                                                        {entry.quantity > 0 ? '+' : ''}{entry.quantity.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-serif italic text-stone-300">
                                                        {entry.source || "-"}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-black font-heading text-stone-500 uppercase tracking-widest text-right">
                                                        {entry.Users?.display_name || "Unknown Admin"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
