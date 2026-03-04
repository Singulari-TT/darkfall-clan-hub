import { NextResponse } from "next/server";
import { getBestiaryData, getTransmuteData, getDungeonsData } from "@/lib/sheets";

// A unified endpoint to grab all searchable Knowledge Base items 
export async function GET() {
    try {
        // Fetch all 3 major datasets in parallel
        const [monsters, recipes, dungeons] = await Promise.all([
            getBestiaryData(),
            getTransmuteData(),
            getDungeonsData()
        ]);

        // Format them into a generic searchable array
        const searchableItems = [
            ...monsters.map(m => ({
                id: `bestiary-${m.Name}`,
                title: m.Name,
                type: 'Monster',
                href: `/database/bestiary#${m.Name.toLowerCase().replace(/\s+/g, '-')}`,
                subtitle: `HP: ${m["Avg Health"]} | Weak to: ${m["Magic to use in order (left to right)"] || "None"}`
            })),
            ...recipes.map(r => ({
                id: `recipe-${r.Name || r.Effect}`,
                title: r.Name || `${r.Effect} ${r["Item Type"]}`,
                type: 'Crafting',
                href: `/database/crafting`,
                subtitle: `${r.Catalyst} + ${[r["Component 1"], r["Component 2"], r["Component 3"]].filter(Boolean).join(", ")}`
            })),
            ...dungeons.map(d => ({
                id: `dungeon-${d["Dungeon Name"]}`,
                title: d["Dungeon Name"],
                type: 'Dungeon',
                href: `/database/dungeons`,
                subtitle: `Located at ${d["General Location"]}`
            }))
        ];

        return NextResponse.json(searchableItems);
    } catch (error) {
        console.error("Search API Error:", error);
        return NextResponse.json({ error: "Failed to fetch search data" }, { status: 500 });
    }
}
