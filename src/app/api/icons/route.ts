import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const iconsDir = path.join(process.cwd(), 'public', 'images', 'icons');

        if (!fs.existsSync(iconsDir)) {
            return NextResponse.json({ icons: [] });
        }

        const files = fs.readdirSync(iconsDir);

        // Filter only image files (e.g. .bmp, .png, .jpg, .gif)
        const validExtensions = ['.bmp', '.png', '.jpg', '.jpeg', '.gif'];
        const iconFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return validExtensions.includes(ext);
        });

        return NextResponse.json({ icons: iconFiles });
    } catch (error) {
        console.error('Error reading icons directory:', error);
        return NextResponse.json({ error: 'Failed to load icons' }, { status: 500 });
    }
}
