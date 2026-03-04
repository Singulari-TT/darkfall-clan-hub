import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// This is a basic NextAuth middleware that protects all routes except the defined ones.
// We will also use it to handle the 'Pending' status redirect.
export default withAuth(
    function middleware(req) {
        const isAuth = !!req.nextauth.token
        const isAuthPage = req.nextUrl.pathname.startsWith('/login')
        const token = req.nextauth.token

        // In a real scenario, we'd check the user's status from a database call or JWT claims.
        // For this prototype, if a token exists, we'll assume they need approval unless verified
        // by another means. We'll simulate checking the database later.

        // Protect the protected routes
        if (!isAuth && !isAuthPage && req.nextUrl.pathname !== '/') {
            return NextResponse.redirect(new URL('/login', req.url))
        }

        // If authenticated but Pending, force them to the waiting-approval page
        if (isAuth && token?.status === 'Pending') {
            if (req.nextUrl.pathname !== '/waiting-approval' && !req.nextUrl.pathname.startsWith('/api/')) {
                return NextResponse.redirect(new URL('/waiting-approval', req.url))
            }
        }

        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: () => true, // Let the middleware function handle the logic
        },
    }
)

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)']
}
