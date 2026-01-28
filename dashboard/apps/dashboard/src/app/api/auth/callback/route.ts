import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const origin = url.origin;
  if (!code || !state) return NextResponse.redirect(`${origin}/login?error=missing_code_or_state`);

  const cookieStore = await cookies();
  const savedState = cookieStore.get('oidc_state')?.value;

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${origin}/login?error=invalid_state`);
  }

  cookieStore.delete('oidc_state');

  const issuer = process.env.AUTHENTIK_ISSUER || process.env.OIDC_ISSUER;
  const clientId = process.env.AUTHENTIK_CLIENT_ID || process.env.OIDC_CLIENT_ID;
  const clientSecret = process.env.AUTHENTIK_CLIENT_SECRET || process.env.OIDC_CLIENT_SECRET;
  const redirectUri = process.env.AUTHENTIK_REDIRECT_URI || process.env.OIDC_REDIRECT_URI;

  const tokenRes = await fetch(`${issuer}/application/o/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri!,
      client_id: clientId!,
      client_secret: clientSecret!,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${origin}/login?error=token_exchange_failed`);
  }

  const tokenJson = await tokenRes.json();
  const accessToken = tokenJson.access_token;
  const refreshToken = tokenJson.refresh_token;

  const userRes = await fetch(`${issuer}/application/o/userinfo/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userRes.ok) {
    return NextResponse.redirect(`${origin}/login?error=userinfo_failed`);
  }

  const userInfo = await userRes.json();

  const session = {
    id: String(userInfo.sub || userInfo.id || userInfo.username || userInfo.email),
    email: userInfo.email,
    name: userInfo.name || userInfo.username,
    role: (userInfo.role || 'worker'),
  };

  cookieStore.set({
    name: 'zap_session',
    value: JSON.stringify(session),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });

  if (refreshToken) {
    cookieStore.set({
      name: 'refresh_token',
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/api/auth/',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return NextResponse.redirect(origin + '/');
}
