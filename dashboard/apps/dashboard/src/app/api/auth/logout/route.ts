import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('zap_session');
  cookieStore.delete('refresh_token');

  // Optionally redirect to IdP end-session endpoint
  // const logoutUrl = `${process.env.OIDC_ISSUER}/application/o/logout/?post_logout_redirect_uri=${encodeURIComponent(process.env.APP_BASE_URL!)}`;
  // return NextResponse.redirect(logoutUrl);

  return NextResponse.redirect('/login');
}
