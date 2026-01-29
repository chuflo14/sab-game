import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Routes to be protected
    const protectedRoutes = ['/admin', '/redeem'];

    // Check if the current route is protected
    const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

    if (isProtected) {
        const session = request.cookies.get('sb_session');

        if (!session) {
            // Redirect to login if no session found
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('next', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: ['/admin/:path*', '/redeem/:path*'],
};
