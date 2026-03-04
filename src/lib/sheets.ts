import Papa from "papaparse";

/**
 * Utility function to fetch a public Google Sheet as JSON
 * Provide the full Google Sheets EXPORT url (format=csv)
 */
export async function fetchGoogleSheet(csvUrl: string) {
    try {
        // We add next: { revalidate: 300 } to cache the fetch for 5 minutes.
        // This makes the page load instantly for users, while still updating frequently
        // if the Google Sheet changes.
        const response = await fetch(csvUrl, {
            next: { revalidate: 300 },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch sheet: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();

        // Parse the CSV text into an array of Javascript Objects
        const parsed = Papa.parse(csvText, {
            header: true,      // Trun the first row into object keys
            skipEmptyLines: true, // Ignore blank rows in the sheet
        });

        return parsed.data;
    } catch (error) {
        console.error("Error fetching Google Sheet:", error);
        return [];
    }
}

// ==========================================
// Specific Sheet Fetchers & Types
// ==========================================

export interface Monster {
    Name: string;
    "Avg Health": string;
    "Exp Mod": string;
    "Attack Type": string;
    "Magic to use in order (left to right)": string;
    "Invunerable/Resitant to": string;
    Notes: string;
}

/**
 * Fetches the Bestiary Sheet and returns strongly typed Monsters
 */
export async function getBestiaryData(): Promise<Monster[]> {
    const url = "https://docs.google.com/spreadsheets/d/18Chcic4F9yTu3AJNLVOX1rXKlILLmS5ag1g7PSWRTb0/export?format=csv&gid=583287523";
    const data = await fetchGoogleSheet(url);

    // The first few rows of this sheet contain instructions/key data that aren't actual monsters.
    // We can filter out rows that don't look like actual monster data.
    return data.filter((row: any) => {
        // Only return rows that actually have a Name and an Exp Mod (which means it's a real monster stat block)
        return row.Name && row.Name.trim() !== "" && row["Exp Mod"] && row["Exp Mod"].trim() !== "" && row.Name !== "Name";
    }) as Monster[];
}


export interface Dungeon {
    "Dungeon Name": string;
    "General Location": string;
    "Quest #1": string;
    "Quest #1 Rewards": string;
    "Quest #2 (Daily)": string;
    "Quest #2 Rewards": string;
    "Faction Associated w/Dungeon": string;
}

/**
 * Fetches the Dungeons Sheet
 */
export async function getDungeonsData(): Promise<Dungeon[]> {
    const url = "https://docs.google.com/spreadsheets/d/13RdMxNs1iYVglzNuFiS0BLf3VN1XGMPZ9ceNN51Id9s/export?format=csv&gid=196454955";
    const data = await fetchGoogleSheet(url);

    // The Dungeons are on a combined sheet somewhere near the bottom, but the URL provided
    // by the user seems to link to a sheet where Dungeons are at the beginning or scattered.
    // Actually, looking at the previous fetch, "Dungeon Name" is column 1.
    return data.filter((row: any) => {
        return row["Dungeon Name"] && row["Dungeon Name"].trim() !== "" && row["Dungeon Name"] !== "Dungeon Name";
    }) as Dungeon[];
}

export interface TransmuteRecipe {
    "Item Type": string;
    Effect: string;
    Catalyst: string;
    "Component 1": string;
    "Component 2": string;
    "Component 3": string;
    Name: string;
}

/**
 * Fetches the Transmute Recipes
 */
export async function getTransmuteData(): Promise<TransmuteRecipe[]> {
    const url = "https://docs.google.com/spreadsheets/d/133cYhwbduvo48Frls5bTZjJrlDsXvX0M0YsW8G33tcY/export?format=csv&gid=1463135482";
    const data = await fetchGoogleSheet(url);

    return data.filter((row: any) => {
        // The Transmute sheet has the header repeated every few rows. We need to filter those out.
        // A valid recipe row will have an Effect that is NOT "Effect"
        return row["Item Type"] &&
            row["Item Type"].trim() !== "" &&
            row["Effect"] &&
            row["Effect"] !== "Effect";
    }) as TransmuteRecipe[];
}

export interface HousingModule {
    "House Modules": string | undefined;
}

/**
 * Fetches the Housing Modules Requirements
 */
export async function getHousingData(): Promise<any[]> {
    const url = "https://docs.google.com/spreadsheets/d/16eUow2wTdVsvsuGSWTLBzaxFg3tywnFPvAO44t7sbFo/export?format=csv&gid=0";
    const data = await fetchGoogleSheet(url);

    // This sheet is very strangely formatted, with lots of empty space.
    // We just want to extract the module components.
    return data;
}
