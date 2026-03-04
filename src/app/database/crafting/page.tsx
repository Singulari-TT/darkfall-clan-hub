import { getTransmuteData } from "@/lib/sheets";
import { Scroll, Zap, Droplets, Flame, Snowflake, Skull, Sparkles } from "lucide-react";

export default async function CraftingPage() {
    const recipes = await getTransmuteData();

    const getElementColor = (effect: string) => {
        switch (effect?.toLowerCase()) {
            case "fire": return "text-orange-400 border-orange-900/50 bg-orange-950/30";
            case "ice": return "text-cyan-400 border-cyan-900/50 bg-cyan-950/30";
            case "lightning": return "text-yellow-400 border-yellow-900/50 bg-yellow-950/30";
            case "acid": return "text-green-400 border-green-900/50 bg-green-950/30";
            case "holy": return "text-amber-400 border-amber-900/50 bg-amber-950/30";
            case "unholy": return "text-purple-400 border-purple-900/50 bg-purple-950/30";
            default: return "text-gray-300 border-white/10 bg-black/40";
        }
    };

    const getElementIcon = (effect: string) => {
        switch (effect?.toLowerCase()) {
            case "fire": return <Flame className="w-4 h-4" />;
            case "ice": return <Snowflake className="w-4 h-4" />;
            case "lightning": return <Zap className="w-4 h-4" />;
            case "acid": return <Droplets className="w-4 h-4" />;
            case "holy": return <Sparkles className="w-4 h-4" />;
            case "unholy": return <Skull className="w-4 h-4" />;
            default: return null;
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                    <h2 className="text-2xl font-black text-amber-500 tracking-wider font-heading uppercase flex items-center gap-3">
                        <Scroll className="w-6 h-6 text-red-500" />
                        Transmutation Formulas
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Elemental weapon crafting recipes. Total recorded permutations: {recipes.length}.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
                {recipes.map((recipe, idx) => (
                    <div key={idx} className="bg-black/30 border border-white/5 rounded-lg overflow-hidden group hover:border-red-900/30 transition-all">
                        <div className={`px-4 py-3 flex items-center justify-between border-b ${getElementColor(recipe.Effect)}`}>
                            <div className="flex items-center gap-2">
                                {getElementIcon(recipe.Effect)}
                                <h3 className="font-bold uppercase tracking-wider text-sm">{recipe.Name || `${recipe.Effect} ${recipe["Item Type"]}`}</h3>
                            </div>
                            <span className="text-[10px] uppercase tracking-widest opacity-80 font-bold bg-black/50 px-2 py-0.5 rounded">
                                {recipe["Item Type"]}
                            </span>
                        </div>

                        <div className="p-4 space-y-4">
                            <div>
                                <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-1 block">Required Catalyst</span>
                                <span className="text-amber-200 text-sm font-medium bg-amber-950/20 border border-amber-900/30 px-2 py-1 rounded inline-block">
                                    {recipe.Catalyst}
                                </span>
                            </div>

                            <div>
                                <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-2 block">Material Components</span>
                                <div className="flex flex-wrap gap-2">
                                    {[recipe["Component 1"], recipe["Component 2"], recipe["Component 3"]].filter(Boolean).map((comp, i) => (
                                        <span key={i} className="text-gray-300 text-xs bg-white/5 border border-white/10 px-2 py-1 rounded">
                                            {comp}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
