"use client";

import { useState } from "react";
import { submitLootAction } from "./actions";
import { Loader2, Send } from "lucide-react";

export default function LootForm({ monsters }: { monsters: string[] }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true);
        setMessage(null);
        try {
            const res = await submitLootAction(formData);
            if (res.success) {
                setMessage({ type: "success", text: "Intel successfully uploaded to the Guild Archives." });
                // Reset form except monster selection
                (document.getElementById("loot-form") as HTMLFormElement).reset();
            } else {
                setMessage({ type: "error", text: res.error || "Failed to submit intel." });
            }
        } catch (e: any) {
            setMessage({ type: "error", text: "An error occurred submitting intel." });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form id="loot-form" action={handleSubmit} className="space-y-6 max-w-lg">
            {message && (
                <div className={`p-4 rounded border text-sm ${message.type === "success" ? "bg-green-950/30 border-green-900/50 text-green-400" : "bg-red-950/30 border-red-900/50 text-red-400"}`}>
                    {message.text}
                </div>
            )}

            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Monster Submitting Intel For</label>
                <select
                    name="monsterName"
                    required
                    className="w-full bg-black/40 border border-red-900/30 rounded px-4 py-2.5 text-gray-200 focus:outline-none focus:border-amber-500 transition-colors capitalize"
                    defaultValue=""
                >
                    <option value="" disabled>Select a monster...</option>
                    {monsters.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Gold Dropped (Total)</label>
                <input
                    type="number"
                    name="goldDropped"
                    placeholder="e.g. 500"
                    className="w-full bg-black/40 border border-white/5 rounded px-4 py-2.5 text-gray-200 focus:outline-none focus:border-amber-500 transition-colors"
                />
            </div>

            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Items Dropped (Comma separated)</label>
                <textarea
                    name="itemsDropped"
                    placeholder="e.g. Iron Ingot, Fire Rune, Selentine Scraps"
                    rows={3}
                    className="w-full bg-black/40 border border-white/5 rounded px-4 py-2.5 text-gray-200 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
                <span className="text-xs text-gray-600 mt-1 block">Separate multiple items with a comma. Leave blank if none.</span>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-red-900 to-amber-600 hover:from-amber-600 hover:to-red-900 text-white font-bold py-3 px-4 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                SUBMIT INTEL
            </button>

        </form>
    );
}
