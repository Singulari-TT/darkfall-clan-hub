// Next.js Server Actions file must start with "use server"
"use server";

import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

export interface ClanGoal {
    id: string;
    title: string;
    description: string;
    status: 'Not Started' | 'In Progress' | 'Completed';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    project_name?: string;
    created_by: string;
    created_at: string;
    image_url?: string;
    directive_type?: string;
    target_ingredients?: Record<string, number>;
    current_ingredients?: Record<string, number>;
    view_count?: number;
}

export async function fetchClanGoals() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        throw new Error("Unauthorized");
    }

    const { data, error } = await supabase
        .from("Clan_Goals")
        .select(`
            *,
            Directive_Views (count)
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching clan goals:", error);
        return [];
    }

    // Map the nested count to a flat property
    const mapped = (data as any[]).map(g => ({
        ...g,
        view_count: g.Directive_Views?.[0]?.count || 0
    }));

    return mapped as ClanGoal[];
}

export async function createClanGoal(title: string, description: string, priority: string, project_name?: string, imageUrl?: string, targetIngredients?: Record<string, number>) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        throw new Error("Unauthorized");
    }

    const { data: userRecord } = await supabase
        .from("Users")
        .select("id")
        .eq("discord_id", session.user.id)
        .single();

    if (!userRecord) throw new Error("Could not authorize user.");

    const { data, error } = await supabase
        .from("Clan_Goals")
        .insert({
            title,
            description,
            priority,
            project_name: project_name || null,
            status: 'Not Started',
            created_by: userRecord.id,
            image_url: imageUrl || null,
            target_ingredients: targetIngredients || {},
            current_ingredients: {}
        })
        .select("*")
        .single();

    if (error) throw new Error("Failed to create clan goal.");
    return data as ClanGoal;
}

export async function updateClanGoalStatus(id: string, newStatus: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("Clan_Goals")
        .update({ status: newStatus })
        .eq("id", id);

    if (error) throw new Error("Failed to update status");
    return true;
}

export async function deleteClanGoal(id: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("Clan_Goals")
        .delete()
        .eq("id", id);

    if (error) throw new Error("Failed to delete goal");
    return true;
}

export async function getFeaturedProject() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) return { featuredProject: null, isAdmin: false };

    const { data: settingData } = await supabase
        .from("Clan_Settings")
        .select("value")
        .eq("key", "featured_project")
        .single();

    const { data: userRecord } = await supabase
        .from("Users")
        .select("role")
        .eq("discord_id", session.user.id)
        .single();

    return {
        featuredProject: settingData?.value || null,
        isAdmin: userRecord?.role === 'Admin'
    };
}

export async function setFeaturedProject(projectName: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) throw new Error("Unauthorized");

    const { data: userRecord } = await supabase
        .from("Users")
        .select("id, role")
        .eq("discord_id", session.user.id)
        .single();

    if (!userRecord || userRecord.role !== 'Admin') throw new Error("Admins only");

    const { error } = await supabase
        .from("Clan_Settings")
        .upsert({
            key: 'featured_project',
            value: projectName,
            updated_by: userRecord.id
        }, { onConflict: 'key' });

    if (error) throw new Error("Failed to update settings");
    return true;
}

// === NEW ACTIONS FOR ADVANCED DIRECTIVES ===

export async function trackDirectiveView(goalId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) return;

    const { data: userRecord } = await supabase
        .from("Users")
        .select("id")
        .eq("discord_id", session.user.id)
        .single();

    if (!userRecord) return;

    // We don't care about errors here (e.g. duplicate key for unique view)
    // We just fire and forget
    await supabase.from("Directive_Views").insert({
        goal_id: goalId,
        user_id: userRecord.id
    });
}

export async function submitDirectiveContribution(goalId: string, ingredientName: string, amount: number) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) throw new Error("Unauthorized");

    const { data: userRecord } = await supabase
        .from("Users")
        .select("id")
        .eq("discord_id", session.user.id)
        .single();

    if (!userRecord) throw new Error("Could not authorize user.");

    const { error } = await supabase
        .from("Directive_Contributions")
        .insert({
            goal_id: goalId,
            user_id: userRecord.id,
            ingredient_name: ingredientName,
            amount: amount,
            status: 'Pending'
        });

    if (error) throw new Error("Failed to submit contribution.")
    return true;
}

export async function fetchPendingContributions(goalId?: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) throw new Error("Unauthorized");

    const { data: userRecord } = await supabase
        .from("Users")
        .select("role")
        .eq("discord_id", session.user.id)
        .single();

    // Only Admins or Quartermasters should verify, but for now we'll just check if admin
    if (!userRecord || userRecord.role !== 'Admin') return [];

    let query = supabase
        .from("Directive_Contributions")
        .select(`
            id, amount, ingredient_name, status, created_at,
            Users ( display_name ),
            Clan_Goals ( title, id )
        `)
        .eq("status", "Pending")
        .order("created_at", { ascending: false });

    if (goalId) query = query.eq("goal_id", goalId);

    const { data, error } = await query;
    if (error) console.error("Error fetching pending:", error);

    return data || [];
}

export async function verifyContribution(contributionId: string, accept: boolean) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) throw new Error("Unauthorized");

    const { data: adminRecord } = await supabase
        .from("Users")
        .select("id, role")
        .eq("discord_id", session.user.id)
        .single();

    if (!adminRecord || adminRecord.role !== 'Admin') throw new Error("Admins only");

    // Start transaction-like flow
    const { data: contrib } = await supabase
        .from("Directive_Contributions")
        .select("*")
        .eq("id", contributionId)
        .single();

    if (!contrib || contrib.status !== 'Pending') throw new Error("Invalid contribution");

    const newStatus = accept ? 'Verified' : 'Rejected';

    const { error: updateCError } = await supabase
        .from("Directive_Contributions")
        .update({ status: newStatus, verified_at: new Date().toISOString(), verified_by: adminRecord.id })
        .eq("id", contributionId);

    if (updateCError) throw new Error("Failed to update status");

    if (accept) {
        const { data: goal } = await supabase
            .from("Clan_Goals")
            .select("current_ingredients")
            .eq("id", contrib.goal_id)
            .single();

        if (goal) {
            const current = goal.current_ingredients || {};
            const ingredient = contrib.ingredient_name;
            current[ingredient] = (current[ingredient] || 0) + contrib.amount;

            await supabase
                .from("Clan_Goals")
                .update({ current_ingredients: current })
                .eq("id", contrib.goal_id);
        }
    }
    return true;
}
