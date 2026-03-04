import NextAuth from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import { createClient } from "@supabase/supabase-js"
import { sendDiscordNotification } from "@/lib/discordWebhook"

// Admin client bypasses RLS to allow user creation during login
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
                    .select("id")
                    .eq("discord_id", token.sub)
                    .single();

                if (data) {
                    token.dbId = data.id;
                }
            }
            return token;
        },
        async session({ session, token }: any) {
            // Send the Supabase mapped UUID to the client, NOT the discord ID string
            if (token.dbId) {
                session.user.id = token.dbId as string;
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
