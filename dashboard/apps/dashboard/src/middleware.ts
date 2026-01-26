import { createI18nMiddleware } from "next-international/middleware";
import { type NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "zap_session";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
});

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  // Get locale from path (first segment after /)
  const pathSegments = path.split("/").filter(Boolean);
  const locale = pathSegments[0] === "en" ? "en" : "";
  const pathWithoutLocale = locale
    ? `/${pathSegments.slice(1).join("/")}`
    : path;

  // Define protected routes (paths without locale prefix)
  const protectedPaths = ["/", "/visitors", "/garbage-history"];
  const isProtected = protectedPaths.some(
    (p) =>
      pathWithoutLocale === p ||
      pathWithoutLocale.startsWith(`${p}/`) ||
      path === `/${locale}${p}` ||
      path.startsWith(`/${locale}${p}/`),
  );

  // Check if accessing login page
  const isLoginPage =
    pathWithoutLocale === "/login" || path === `/${locale}/login`;

  // If no session and trying to access protected route, redirect to login
  if (!sessionCookie && isProtected && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = locale ? `/${locale}/login` : "/login";
    return NextResponse.redirect(url);
  }

  // If session exists, check RBAC
  if (sessionCookie) {
    try {
      const user = JSON.parse(sessionCookie.value);

      // Only admin can access /garbage-history
      const isGarbageHistory =
        pathWithoutLocale === "/garbage-history" ||
        pathWithoutLocale.startsWith("/garbage-history/") ||
        path === `/${locale}/garbage-history` ||
        path.startsWith(`/${locale}/garbage-history/`);

      if (isGarbageHistory && user.role !== "admin") {
        // Redirect to dashboard
        const url = request.nextUrl.clone();
        url.pathname = locale ? `/${locale}` : "/";
        return NextResponse.redirect(url);
      }

      // Prevent authenticated users from visiting login page
      if (isLoginPage) {
        const url = request.nextUrl.clone();
        url.pathname = locale ? `/${locale}` : "/";
        return NextResponse.redirect(url);
      }
    } catch (e) {
      // Invalid cookie, clear it and redirect to login
      const url = request.nextUrl.clone();
      url.pathname = locale ? `/${locale}/login` : "/login";
      const response = NextResponse.redirect(url);
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }
  }

  // Apply i18n middleware
  return I18nMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|assets).*)"],
};
