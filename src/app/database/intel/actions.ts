"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function submitLootAction(formData: FormData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { success: false, error: "You must be logged in to submit intel." };
        }

        // @ts-ignore
        const userId = session.user.id;
        if (!userId) {
            return { success: false, error: "User ID missing from session." };
        }

        const monsterName = formData.get("monsterName") as string;
        const goldDroppedStr = formData.get("goldDropped") as string;
        const itemsDroppedStr = formData.get("itemsDropped") as string;

        if (!monsterName) {
            return { success: false, error: "Monster name is required." };
        }

        const goldDropped = goldDroppedStr ? parseInt(goldDroppedStr, 10) : 0;

        // Parse the comma-separated items list into an array
        let itemsDropped: string[] = [];
        if (itemsDroppedStr && itemsDroppedStr.trim() !== "") {
            itemsDropped = itemsDroppedStr.split(",").map(i => i.trim()).filter(i => i !== "");
        }

        const { error } = await supabaseAdmin
            .from("Intel_Loot")
            .insert({
                user_id: userId,
                monster_name: monsterName,
                gold_dropped: goldDropped,
                items_dropped: itemsDropped,
            });

        if (error) {
            console.error("Supabase insert error:", error);
            return { success: false, error: error.message };
        }

        // We must revalidate the bestiary page so the new loot metrics appear immediately
        revalidatePath("/database/bestiary");
        revalidatePath("/database/intel");

        return { success: true };
    } catch (error: any) {
        console.error("Server action error:", error);
        return { success: false, error: error.message || "An unexpected error occurred." };
    }
}
