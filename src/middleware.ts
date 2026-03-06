export { default } from "next-auth/middleware";

export const config = {
    matcher: [
        /*
         * Protect all routes EXCEPT:
         * - /login, /waiting-approval
         * - /api/auth (NextAuth internals)
         * - /_next (Next.js build assets)
         * - Public static files (images, fonts, icons, etc.)
         */
        "/((?!login|waiting-approval|api/auth|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf)).*)",
    ],
};
