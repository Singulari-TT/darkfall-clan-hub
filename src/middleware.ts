import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAuth = !!token;

        // If authenticated but Pending, force them to the waiting-approval page
        // Exclude /waiting-approval and API routes from this redirect
        if (isAuth && (token as any)?.status === 'Pending') {
            if (req.nextUrl.pathname !== '/waiting-approval' && !req.nextUrl.pathname.startsWith('/api/')) {
                return NextResponse.redirect(new URL('/waiting-approval', req.url));
            }
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            // withAuth will redirect to sign-in page if authorized returns false
            authorized: ({ token }) => !!token,
        },
    }
);

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
