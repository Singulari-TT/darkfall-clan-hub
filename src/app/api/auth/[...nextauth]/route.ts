import NextAuth from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { sendDiscordNotification } from "@/lib/discordWebhook"

export const authOptions = {
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }: any) {
            if (account?.provider === "discord") {
                const { data: existingUser, error } = await supabaseAdmin
                    .from("Users")
                    .select("*")
                    .eq("discord_id", profile.id)
                    .single()

                if (error && error.code === 'PGRST116') {
                    // User doesn't exist, create them locally
                    const { error: insertError } = await supabaseAdmin.from("Users").insert({
                        discord_id: profile.id, // Only provide required fields, let DB generate UUID
                        role: "Member",
                        status: "Pending"
                    })

                    if (!insertError) {
                        await sendDiscordNotification(`🔔 **New User Registration:** \`${profile.username}\` just signed in and is awaiting approval by an Admin.`);
                    } else {
                        console.error("Error creating new user:", insertError);
                    }
                } else if (existingUser) {
                    // Log the sign in event using Admin client since user may not have token yet
                    await supabaseAdmin.from("Audit_Logs").insert({
                        user_id: existingUser.id,
                        action: "LOGIN",
                        resource: "System",
                        details: `Logged in via Discord`
                    });
                }
            }
            return true
        },
        async jwt({ token, user, account, profile }: any) {
            // On initial sign in, account and profile are present.
            // On subsequent requests, only token is present.

            // If we haven't mapped the local database UUID yet
            if (!token.dbId && token.sub) {
                const { data } = await supabaseAdmin
                    .from("Users")
                    .select("id, role, status, display_name")
                    .eq("discord_id", token.sub)
                    .single();

                if (data) {
                    token.dbId = data.id;
                    token.role = data.role;
                    token.status = data.status;
                    token.displayName = data.display_name;
                }
            }
            return token;
        },
        async session({ session, token }: any) {
            // Send the Supabase mapped properties to the client
            if (token.dbId) {
                session.user.id = token.dbId as string;
                (session.user as any).role = token.role as string;
                (session.user as any).status = token.status as string;
                (session.user as any).displayName = token.displayName as string | null;
            } else {
                session.user.id = token.sub; // Fallback entirely if db query fails
            }
            return session;
        }
    },
    session: {
        strategy: "jwt" as const,
    },
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
