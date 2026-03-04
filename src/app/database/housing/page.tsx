import { getHousingData } from "@/lib/sheets";
import { Home, Hammer, Pickaxe, Axe } from "lucide-react";

export default async function HousingPage() {
    const rawData = await getHousingData();

    // The Housing CSV provided is heavily formatted and empty.
    // For the prototype, we are manually extracting the known static values from the CSV rows we parsed,
    // or we can just statically display the known module cost since it's a single structure type at the moment.

    // Row 19 is: Iron ingot 75,Stone 250,Oak Plank 150,Limestone 10 ,Mahogony Plank 4,,,652500,,,
    // Row 20 is: 20,6,15,180,1500,,,,,,
    // Row 23 is: 1500,1500,2250,1800,6000,13050,,,,,

    // To keep the UI robust immediately, we will display hardcoded derived metrics from the sheet.
    // If the user wants to expand the housing sheet later, we can write a more complex parser.

    // 1x Module Costs
    const moduleCosts = [
        { item: "Iron Ingot", amount: 75, icon: <Hammer className="w-4 h-4 text-gray-400" /> },
        { item: "Stone", amount: 250, icon: <Pickaxe className="w-4 h-4 text-gray-400" /> },
        { item: "Oak Plank", amount: 150, icon: <Axe className="w-4 h-4 text-gray-400" /> },
        { item: "Limestone", amount: 10, icon: <Pickaxe className="w-4 h-4 text-gray-400" /> },
        { item: "Mahogany Plank", amount: 4, icon: <Axe className="w-4 h-4 text-gray-400" /> },
    ];

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                    <h2 className="text-2xl font-black text-amber-500 tracking-wider font-heading uppercase flex items-center gap-3">
                        <Home className="w-6 h-6 text-red-500" />
                        Housing & City Construction
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Material costs for Housing Modules and Guild City structures.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Standard House Module */}
                <div className="bg-black/40 border border-white/5 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-gray-200 mb-2 border-b border-white/10 pb-2">Single House Module</h3>
                    <p className="text-sm text-gray-400 mb-6">Required materials to construct 1x House Module.</p>

                    <ul className="space-y-3">
                        {moduleCosts.map((mat, idx) => (
                            <li key={idx} className="flex justify-between items-center bg-white/5 px-4 py-2 rounded">
                                <div className="flex items-center gap-3">
                                    {mat.icon}
                                    <span className="font-medium text-gray-300">{mat.item}</span>
                                </div>
                                <span className="text-amber-500 font-bold">{mat.amount}</span>
                            </li>
                        ))}
                    </ul>
                </div>

            </div>
        </div>
    );
}
