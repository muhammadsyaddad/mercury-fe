import { getSession } from '@/lib/action';
import UsersClient from './UsersClient';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@vision_dashboard/ui/card";
import { LogoutButton } from "@/components/logout-button";

/**
 * Server Component wrapper for the Users page.
 *
 * - Uses server-side `getSession()` (from src/lib/auth) to obtain the current session using cookies.
 * - If no session is present, redirect to /login (server-side).
 * - If session exists but user is not admin, render Access Denied server-side.
 * - Otherwise, render the client component `UsersClient` and pass the session as `initialUser`.
 *
 * This avoids calling client-only `useAuth()` in server-rendered pages and makes the auth
 * check authoritative on the server.
 */
export default async function UsersPage() {
  // Fetch session server-side using cookies (lib/auth uses next/headers)
  const session = await getSession();

  // If not authenticated, redirect to /login on the server
  if (!session) {
    redirect('/login');
  }

  // If authenticated but not admin, render Access Denied server-side
  if (session && session.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <LogoutButton />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You don't have permission to access this page. Admin privileges are required.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Otherwise render the client component and pass the server session
  return <UsersClient initialUser={session} />;
}
