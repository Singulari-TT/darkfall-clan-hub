import { getDungeonsData } from "@/lib/sheets";
import { Skull, MapPin, Swords, Target } from "lucide-react";

export default async function DungeonsPage() {
    const dungeons = await getDungeonsData();

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                    <h2 className="text-2xl font-black text-amber-500 tracking-wider font-heading uppercase flex items-center gap-3">
                        <Skull className="w-6 h-6 text-red-500" />
                        Dungeons Explorer
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Global coordinates and daily intelligence on {dungeons.length} known dungeon locations.
                    </p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-red-900/30 bg-black/40 text-gray-400 text-xs font-bold uppercase tracking-widest">
                            <th className="p-4 font-heading whitespace-nowrap">Dungeon Name</th>
                            <th className="p-4 font-heading">Location</th>
                            <th className="p-4 font-heading hidden sm:table-cell">Associated Faction</th>
                            <th className="p-4 font-heading">Daily Quest</th>
                            <th className="p-4 font-heading">Rewards</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {dungeons.map((dungeon, idx) => (
                            <tr
                                key={idx}
                                className="border-b border-white/5 bg-black/20 hover:bg-black/40 hover:border-red-900/30 transition-colors group"
                            >
                                <td className="p-4">
                                    <div className="font-bold text-gray-200 group-hover:text-amber-500 transition-colors">
                                        {dungeon["Dungeon Name"]}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2 text-gray-400 font-mono text-xs">
                                        <MapPin className="w-3 h-3 text-red-700" />
                                        {dungeon["General Location"] || "Unknown"}
                                    </div>
                                </td>
                                <td className="p-4 hidden sm:table-cell">
                                    <span className="text-gray-500 italic">
                                        {dungeon["Faction Associated w/Dungeon"] || "None"}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {dungeon["Quest #2 (Daily)"] && dungeon["Quest #2 (Daily)"].trim() !== "" ? (
                                        <div className="flex items-center gap-2 text-orange-200 bg-orange-950/20 px-2 py-1 rounded inline-flex text-xs font-medium border border-orange-900/30">
                                            <Target className="w-3 h-3" />
                                            {dungeon["Quest #2 (Daily)"]}
                                        </div>
                                    ) : (
                                        <span className="text-gray-600 text-xs italic">No Daily Quest</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="text-gray-300 text-xs max-w-xs">
                                        {dungeon["Quest #2 Rewards"] || "-"}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
