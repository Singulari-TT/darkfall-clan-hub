import { getBestiaryData } from "@/lib/sheets";
import { Skull, Droplets, Zap, Sparkles, Flame, Snowflake, Shield } from "lucide-react";

export default async function BestiaryPage() {
    const monsters = await getBestiaryData();

    // Helper to colorize the resistances or weaknesses based on element name
    const renderElements = (elementString: string | undefined, isWeakness: boolean) => {
        if (!elementString || elementString.trim() === "" || elementString.toLowerCase() === "none") {
            return <span className="text-gray-600 text-xs italic">None</span>;
        }

        const elements = elementString.split(",").map(e => e.trim()).filter(e => e);

        return (
            <div className="flex flex-wrap gap-2">
                {elements.map((el, i) => {
                    let bg = isWeakness ? "bg-red-950/40 border-red-900/50 text-red-200" : "bg-blue-950/40 border-blue-900/50 text-blue-200";
                    let icon = null;

                    const lowerEl = el.toLowerCase();
                    if (lowerEl.includes("fire")) {
                        bg = isWeakness ? "bg-orange-950/40 border-orange-900/50 text-orange-200" : "bg-orange-950/40 border-orange-500/50 text-orange-200";
                        icon = <Flame className="w-3 h-3" />;
                    } else if (lowerEl.includes("cold") || lowerEl.includes("ice")) {
                        bg = isWeakness ? "bg-cyan-950/40 border-cyan-900/50 text-cyan-200" : "bg-cyan-950/40 border-cyan-500/50 text-cyan-200";
                        icon = <Snowflake className="w-3 h-3" />;
                    } else if (lowerEl.includes("lightning") || lowerEl.includes("air")) {
                        bg = isWeakness ? "bg-yellow-950/40 border-yellow-900/50 text-yellow-200" : "bg-yellow-950/40 border-yellow-500/50 text-yellow-200";
                        icon = <Zap className="w-3 h-3" />;
                    } else if (lowerEl.includes("acid")) {
                        bg = isWeakness ? "bg-green-950/40 border-green-900/50 text-green-200" : "bg-green-950/40 border-green-500/50 text-green-200";
                        icon = <Droplets className="w-3 h-3" />;
                    } else if (lowerEl.includes("holy")) {
                        bg = isWeakness ? "bg-amber-950/40 border-amber-900/50 text-amber-200" : "bg-amber-950/40 border-amber-500/50 text-amber-200";
                        icon = <Sparkles className="w-3 h-3" />;
                    } else if (lowerEl.includes("unholy")) {
                        bg = isWeakness ? "bg-purple-950/40 border-purple-900/50 text-purple-200" : "bg-purple-950/40 border-purple-500/50 text-purple-200";
                        icon = <Skull className="w-3 h-3" />;
                    }

                    return (
                        <span key={i} className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${bg}`}>
                            {icon}
                            {el}
                        </span>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                    <h2 className="text-2xl font-black text-amber-500 tracking-wider font-heading uppercase flex items-center gap-3">
                        <Skull className="w-6 h-6 text-red-500" />
                        Bestiary Archives
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Combat intelligence on {monsters.length} known creatures. Live data sync.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {monsters.map((monster, index) => (
                    <div key={index} className="bg-black/40 border border-white/5 rounded-lg p-5 hover:border-red-900/30 transition-colors relative overflow-hidden group">
                        {/* Subtle Gradient background on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative z-10 flex flex-col h-full">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-lg text-gray-200 capitalize group-hover:text-amber-500 transition-colors">
                                    {monster.Name}
                                </h3>
                                <span className="flex items-center justify-center bg-red-950/50 border border-red-900/50 text-red-200 text-xs font-black px-2 py-1 rounded">
                                    HP: {monster["Avg Health"] || "???"}
                                </span>
                            </div>

                            {/* Combat Details */}
                            <div className="space-y-4 flex-grow">

                                {/* Attack Style */}
                                <div>
                                    <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-1 block">Attack Style</span>
                                    <div className="text-sm text-gray-300">
                                        {monster["Attack Type"] || "Unknown"}
                                    </div>
                                </div>

                                {/* Weaknesses */}
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest block flex items-center gap-1">
                                        Best Magic / Weaknesses
                                    </span>
                                    {renderElements(monster["Magic to use in order (left to right)"], true)}
                                </div>

                                {/* Resistances */}
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest block flex items-center gap-1">
                                        <Shield className="w-3 h-3 opacity-50" />
                                        Invulnerable / Resistant
                                    </span>
                                    {renderElements(monster["Invunerable/Resitant to"], false)}
                                </div>

                            </div>

                            {/* Footer / Notes */}
                            {monster.Notes && monster.Notes.trim() !== "" && (
                                <div className="mt-4 pt-3 border-t border-white/5 text-xs text-gray-500 italic">
                                    {monster.Notes}
                                </div>
                            )}

                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
