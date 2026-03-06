import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// Initialize the Google Gen AI Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Authentication required." }, { status: 401 });
        }

        const { imageBase64 } = await req.json();

        if (!imageBase64) {
            return NextResponse.json({ error: "No image provided." }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "GEMINI_API_KEY is missing from environment variables." }, { status: 500 });
        }

        // Strip the data URI preamble to get raw base64
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        const prompt = `
        You are an elite video game A.I. assisting a clan with "Loot Splitting".
        The user has provided a screenshot of a grid of item icons and quantities from the MMO "Darkfall Rise of Agon".

        Your task is to identify every unique item in this grid and return a strict JSON array summarizing the loot.
        
        Rules:
        1. Look at the item graphic to determine its name (e.g. A blue bottle is a "Mana Potion", a pink bucket is "Dye Tub", a skull is "Monster Skull", a gold pile is "Gold Coins"). 
        2. Look at the small green or white numbers overlaid on the icon to determine the Quantity. If there is no number, the quantity is 1.
        3. Do NOT include empty grid slots.
        4. Return ONLY a valid JSON array of objects. Do not wrap it in markdown codeblocks like \`\`\`json. Just the raw JSON.
        
        Expected Format:
        [
          { "id": "1", "name": "Gold Coins", "quantity": 34030, "valuePerUnit": 0 },
          { "id": "2", "name": "Mana Potion", "quantity": 16, "valuePerUnit": 0 }
        ]
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash-latest',
            contents: [
                prompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: 'image/png' // Assuming the canvas/clipboard crop outputs PNG
                    }
                }
            ]
        });

        // The response might contain markdown formatting (```json) despite instructions, so we clean it
        let rawJson = response.text;
        if (rawJson?.startsWith('```json')) {
            rawJson = rawJson.replace(/```json\n/, '').replace(/\n```$/, '');
        }

        try {
            const parsedItems = JSON.parse(rawJson || "[]");
            return NextResponse.json({ items: parsedItems });
        } catch (parseError) {
            console.error("Failed to parse Gemini output:", rawJson);
            return NextResponse.json({ error: "The A.I. failed to return a valid JSON structure.", rawResponse: rawJson }, { status: 500 });
        }

    } catch (e: any) {
        console.error("Vision API Error:", e);
        return NextResponse.json({ error: e.message || "Internal server error connecting to A.I." }, { status: 500 });
    }
}
