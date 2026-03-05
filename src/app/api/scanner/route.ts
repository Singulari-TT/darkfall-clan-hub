import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { imageBase64, extractedName: clientExtractedName } = await req.json();

        if (!imageBase64) {
            return NextResponse.json({ error: "No image provided." }, { status: 400 });
        }

        if (!clientExtractedName) {
            return NextResponse.json({ error: "Item name is required." }, { status: 400 });
        }

        let extractedName = clientExtractedName.trim();

        // 2. Check Database for duplicate
        const { data: existingItem, error: findError } = await supabase
            .from('Game_Items')
            .select('id, name')
            .ilike('name', extractedName) // Case-insensitive match
            .single();

        if (existingItem) {
            return NextResponse.json({
                error: `Duplicate: "${existingItem.name}" already exists in the database!`
            }, { status: 409 });
        }

        // 3. Convert Base64 back to buffer for uploading
        // Remove the data URI preamble if present
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const fileName = `${extractedName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${Date.now()}.png`;

        // 4. Upload to Supabase Storage 'item-icons'
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('item-icons')
            .upload(fileName, imageBuffer, {
                contentType: 'image/png',
                upsert: false
            });

        if (uploadError) {
            return NextResponse.json({ error: "Failed to upload image: " + uploadError.message }, { status: 500 });
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from('item-icons')
            .getPublicUrl(fileName);

        const iconUrl = publicUrlData.publicUrl;

        // 5. Save Record to Database
        const { error: insertError } = await supabase
            .from('Game_Items')
            .insert({
                name: extractedName,
                icon_url: iconUrl,
                added_by: session.user.id
            });

        if (insertError) {
            return NextResponse.json({ error: "Failed to save record: " + insertError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Successfully archived "${extractedName}"!`,
            item: { name: extractedName, iconUrl }
        });

    } catch (e: any) {
        console.error("OCR Scanner Error:", e);
        return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
    }
}
