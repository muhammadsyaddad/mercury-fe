import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'zap_session';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!session) return new NextResponse(null, { status: 401 });

  try {
    const parsed = JSON.parse(session);
    return NextResponse.json(parsed);
  } catch (e) {
    return new NextResponse(null, { status: 401 });
  }
}
