import type { DefaultSession } from "next-auth";

// Automatically included by TS compiler if in the source directory
declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            /** The user's ID. */
            id: string;
        } & DefaultSession["user"];
    }
}
