import { getNewPlayerGuideRaw } from "@/lib/sheets";
import { BookOpen, Shield, Sword, Wrench, Sprout } from "lucide-react";

export default async function NewPlayerGuidePage() {
    // Fetch the raw 2D array of string cells
    const rawData = await getNewPlayerGuideRaw();

    // The Google Sheet is highly unstructured. We will extract 
    // the specific paragraphs and sections by looking for known headers.

    // Helper to find the row index of a specific section title
    const findRowIndex = (text: string) => {
        return rawData.findIndex(row =>
            row.some(cell => cell.toLowerCase().includes(text.toLowerCase()))
        );
    };

    // Helper to grab the paragraph directly underneath a section title
    const getParagraphText = (startIndex: number) => {
        if (startIndex === -1 || startIndex + 1 >= rawData.length) return "";
        // The text is usually in the second column (index 1) in the row right below the header
        return rawData[startIndex + 1]?.[1] || "Content not found.";
    };

    // Extract Sections
    const titleQuestsIdx = findRowIndex("1. Attribute Title Quests");
    const npcsIdx = findRowIndex("2. Quests / Tasks");
    const classesIdx = findRowIndex('3. "Classes" in Rise of Agon');
    const mageSkillsIdx = findRowIndex("3a. Mage Skills");
    const destroyerSkillsIdx = findRowIndex("3b. Destroyer Skills");

    const pTitleQuests = getParagraphText(titleQuestsIdx);
    const pNPCs = getParagraphText(npcsIdx);
    const pClasses = getParagraphText(classesIdx);
    const pMage = getParagraphText(mageSkillsIdx);
    const pDestroyer = getParagraphText(destroyerSkillsIdx);

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                    <h2 className="text-2xl font-black text-amber-500 tracking-wider font-heading uppercase flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-red-500" />
                        New Player Guide & Roadmap
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Essential intelligence for surviving and thriving in Agon. Read carefully.
                    </p>
                </div>
            </div>

            <div className="space-y-8">

                {/* Section 1 & 2: Quests and Titles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black/40 border border-white/5 rounded-lg p-6 hover:border-amber-900/30 transition-colors">
                        <h3 className="text-lg font-bold text-amber-500 mb-3 flex items-center gap-2">
                            <Sprout className="w-5 h-5" />
                            Attribute Title Quests
                        </h3>
                        <p className="text-sm text-gray-300 leading-relaxed font-serif">
                            {pTitleQuests}
                        </p>
                    </div>

                    <div className="bg-black/40 border border-white/5 rounded-lg p-6 hover:border-amber-900/30 transition-colors">
                        <h3 className="text-lg font-bold text-amber-500 mb-3 flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            Daily Tasks & Meditation
                        </h3>
                        <p className="text-sm text-gray-300 leading-relaxed font-serif">
                            {pNPCs}
                        </p>
                    </div>
                </div>

                {/* Section 3: Classes Overview */}
                <div className="bg-black/40 border border-white/5 rounded-lg p-6 hover:border-amber-900/30 transition-colors">
                    <h3 className="text-xl font-bold text-red-500 mb-3 uppercase tracking-wider">
                        Classes in Rise of Agon
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed font-serif">
                        {pClasses}
                    </p>
                </div>

                {/* Section 3a & 3b: Class Deep Dives */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-6 transition-colors">
                        <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2 uppercase tracking-wide">
                            <Shield className="w-5 h-5" />
                            The Mage Path
                        </h3>
                        <p className="text-sm text-gray-300 leading-relaxed font-serif whitespace-pre-wrap">
                            {/* The CSV uses brackets for spell lists, let's style them slightly if possible, or just print */}
                            {pMage}
                        </p>
                    </div>

                    <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-6 transition-colors">
                        <h3 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2 uppercase tracking-wide">
                            <Sword className="w-5 h-5" />
                            The Destroyer Path
                        </h3>
                        <p className="text-sm text-gray-300 leading-relaxed font-serif whitespace-pre-wrap">
                            {pDestroyer}
                        </p>
                    </div>
                </div>

                {/* Materials & Farming Placeholder */}
                <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-6 text-center">
                    <Wrench className="w-8 h-8 text-amber-600 mx-auto mb-3 opacity-50" />
                    <h3 className="text-amber-500 font-bold uppercase tracking-widest text-sm mb-2">
                        Gear Materials & Farming Spots
                    </h3>
                    <p className="text-xs text-gray-400">
                        Check the Knowledge Base's Crafting & Alchemy tabs for detailed material tables and crafting breakdowns.
                    </p>
                </div>

            </div>
        </div>
    );
}
