import { NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import { Jimp } from 'jimp';
import { supabase } from '@/lib/supabase';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { imageBase64 } = await req.json();

        if (!imageBase64) {
            return NextResponse.json({ error: "No image provided." }, { status: 400 });
        }

        // 1. Pre-process the image for OCR
        const base64DataRaw = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const imageBufferRaw = Buffer.from(base64DataRaw, 'base64');

        const jimpImage = await Jimp.read(imageBufferRaw);

        // Darkfall text is light on dark. Convert to black on white for OCR.
        // We also want to ONLY read the top 35 pixels where the Title lives.
        // Reading the entire description box takes exponential time and introduces errors.
        jimpImage
            .crop({ x: 0, y: 0, w: jimpImage.bitmap.width, h: Math.min(jimpImage.bitmap.height, 40) }) // Grab just the top title slice
            .greyscale()
            .contrast(0.5)
            .invert();

        const processedBase64 = await jimpImage.getBase64('image/png');

        // 2. Run OCR on the processed image
        // Use /tmp for cache to prevent Vercel Serverless read-only filesystem crash
        const worker = await createWorker('eng', 1, {
            cachePath: '/tmp'
        });

        // Add a 10 second timeout promise to prevent Vercel Serverless Function hanging
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Neural OCR engine timed out. Make sure you cropped the image tightly around the text.")), 10000);
        });

        // Race tesseract against our 10 second timeout
        const ret = await Promise.race([
            worker.recognize(processedBase64),
            timeoutPromise
        ]) as any;

        const text = ret.data.text;
        await worker.terminate();

        // The name is typically the very first line of the tooltip
        const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
        if (lines.length === 0) {
            return NextResponse.json({ error: "Could not read any text from the provided image." }, { status: 400 });
        }

        const extractedName = lines[0]; // e.g., "Villa Deed"

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
