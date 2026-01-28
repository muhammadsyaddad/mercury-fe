"use server";

import { cookies } from "next/headers";

export type UserRole = "admin" | "worker";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

const SESSION_COOKIE_NAME = "zap_session";

/**
 * Start login flow.
 *
 * Previously this repository used a local mock login. For SSO/OIDC we
 * start the authorization redirect flow on the client by navigating to
 * `/api/auth/login` which will redirect the browser to the IdP authorize
 * endpoint. Keep this function as a small server-side helper so existing
 * imports don't break — it returns the login URL the client should follow.
 */
export async function login(): Promise<{ redirectTo: string }>
{
  return { redirectTo: "/api/auth/login" };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  // Return the client-side logout endpoint so callers can redirect if needed
  return { redirectTo: "/api/auth/logout" };
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie.value) as User;
  } catch (e) {
    console.error("Failed to parse session cookie", e);
    return null;
  }
}
