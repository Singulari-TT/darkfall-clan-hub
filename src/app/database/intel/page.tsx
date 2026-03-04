import { getBestiaryData } from "@/lib/sheets";
import LootForm from "./LootForm";
import { ScrollText, Upload } from "lucide-react";

export default async function IntelSubmitPage() {
    const monsters = await getBestiaryData();

    // Create a sorted list of unique monster names for the dropdown
    const uniqueMonsterNames = Array.from(new Set(monsters.map(m => m.Name)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                    <h2 className="text-2xl font-black text-amber-500 tracking-wider font-heading uppercase flex items-center gap-3">
                        <Upload className="w-6 h-6 text-red-500" />
                        Submit Loot Intel
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Contribute to the Guild Archives by reporting confirmed beast drops.
                    </p>
                </div>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-lg p-6">
                <div className="mb-6 bg-amber-950/20 border border-amber-900/30 rounded p-4 text-sm text-gray-300">
                    <strong className="text-amber-500 font-bold block mb-1">How this works:</strong>
                    When you submit a verified drop, it automatically pairs with the live Bestiary data. The next time a clanmate looks up this monster, they will see your findings averaged out over time to determine Min/Max gold and item tables!
                </div>

                <LootForm monsters={uniqueMonsterNames} />
            </div>
        </div>
    );
}
