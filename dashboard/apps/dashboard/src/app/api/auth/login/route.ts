import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  // Ambil origin (misal: http://localhost:3000)
  const { origin } = new URL(request.url);

  const issuer = process.env.AUTHENTIK_ISSUER;
  const clientId = process.env.AUTHENTIK_CLIENT_ID;
  const redirectUri = process.env.AUTHENTIK_REDIRECT_URI;

  // Cek apakah env terbaca
  if (!issuer || !clientId || !redirectUri) {
    console.error("DEBUG ENV:", { issuer, clientId, redirectUri });

    // PERBAIKAN: Gunakan URL absolut untuk redirect
    return NextResponse.redirect(`${origin}/login?error=oidc_not_configured`);
  }

  const state = randomBytes(16).toString("hex");

  const cookieStore = await cookies();
  cookieStore.set({
    name: "oidc_state",
    value: state,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  const authorizeUrl = new URL(`${issuer}/application/o/authorize/`);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "openid profile email groups");
  authorizeUrl.searchParams.set("state", state);

  return NextResponse.redirect(authorizeUrl.toString());
}
