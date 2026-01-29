import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Debug logging
  console.log(`[Middleware] Path: ${pathname}`);

  // Skip middleware for static files and assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2)$/)
  ) {
    console.log(`[Middleware] Skipping static file: ${pathname}`);
    return NextResponse.next();
  }

  // Allow all NextAuth API routes
  if (pathname.startsWith("/api/auth")) {
    console.log(`[Middleware] Allowing NextAuth route: ${pathname}`);
    return NextResponse.next();
  }

  // Allow login page (with or without locale prefix)
  if (pathname === "/login" || pathname.endsWith("/login") || pathname.includes("/login")) {
    console.log(`[Middleware] Allowing login page: ${pathname}`);
    return NextResponse.next();
  }

  // Check for NextAuth session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  console.log(`[Middleware] Token exists: ${!!token}`);

  // If no token and trying to access protected route, redirect to login
  if (!token) {
    // Redirect to /en/login (with locale prefix since that's where the page actually is)
    const loginUrl = new URL("/en/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    console.log(`[Middleware] No token, redirecting to: ${loginUrl.toString()}`);
    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated, allow access
  console.log(`[Middleware] Authenticated, allowing: ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
