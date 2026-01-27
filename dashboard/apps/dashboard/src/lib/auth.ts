"use server";

import { cookies } from "next/headers";

export type UserRole = "admin" | "worker";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// Only admin user is allowed
const VALID_USER: User = {
  id: "1",
  email: "zap@test.com",
  name: "Zap Admin",
  role: "admin",
};

const VALID_PASSWORD = "zap123";

const SESSION_COOKIE_NAME = "zap_session";

export async function login(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: User; error?: string }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Only allow zap@test.com with password zap123
  if (email !== VALID_USER.email || password !== VALID_PASSWORD) {
    return { success: false, error: "Invalid credentials" };
  }

  // Create session (simple JSON for mock)
  const sessionData = JSON.stringify(VALID_USER);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  });

  return { success: true, user: VALID_USER };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
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
