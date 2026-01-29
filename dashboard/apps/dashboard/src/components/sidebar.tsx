"use client";

import { type User as UserType } from "@/lib/action";
import { apiService } from "@/services/api";
import { Avatar, AvatarFallback } from "@vision_dashboard/ui/avatar";
import { cn } from "@vision_dashboard/ui/cn";
import { Icons } from "@vision_dashboard/ui/icons";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MainMenu } from "./main-menu";

// Helper to get initials from name
function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    const first = parts[0]?.[0] ?? "";
    const last = parts[parts.length - 1]?.[0] ?? "";
    return `${first}${last}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Sidebar({ initialUser }: { initialUser?: UserType | null }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [user, setUser] = useState<UserType | null>(initialUser ?? null);
  const router = useRouter();

  useEffect(() => {
    // If initialUser is provided by server render, prefer it and skip client fetch.
    if (initialUser) {
      setUser(initialUser);
      return;
    }

    // Fallback: fetch current user from API on client-side
    const fetchUser = async () => {
      try {
        const currentUser = await apiService.getCurrentUser();
        setUser(currentUser);
      } catch (e) {
        console.error("Failed to fetch session", e);
      }
    };
    fetchUser();
  }, [initialUser]);

  const handleLogout = async () => {
    try {
      // Call server-side logout endpoint to clear session cookie (if available)
      // Use credentials: 'include' so cookies are sent
      await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      // If the API logout fails (404 or network), we still proceed to clear client state
      console.error('Logout API call failed', err);
    } finally {
      // Clear local client-side auth data and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <aside
      className={cn(
        "h-screen flex-shrink-0 flex-col justify-between fixed top-0 pb-4 items-center hidden md:flex z-50 transition-all duration-200 ease-out",
        "bg-[#fafafa] dark:bg-[#0a0a0a] border-r border-[#e5e5e5] dark:border-[#1a1a1a]",
        isExpanded ? "w-[200px]" : "w-[60px]",
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo */}
      <div
        className={cn(
          "h-[50px] flex items-center border-b border-[#e5e5e5] dark:border-[#1a1a1a] transition-all duration-200 ease-out w-full",
        )}
      >
        <Link href="/" className="flex items-center justify-center w-[100px] px-2">
          <Icons.LogoZap />
        </Link>
      </div>
      {/* Navigation */}
      <div className="flex flex-col w-full pt-2 flex-1">
        <MainMenu isExpanded={isExpanded} userRole={user?.role} />
      </div>

      {/* User Profile Section */}
      <div className="w-full px-2 pb-2">
        {user && (
          <div className="flex flex-col gap-1">
            {/* User Avatar & Info */}
            <div
              className={cn(
                "flex items-center h-[32px] rounded-md transition-colors px-2",
              )}
            >
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarFallback className="bg-black dark:bg-white text-white dark:text-black text-[10px] font-medium">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              {isExpanded && (
                <div className="ml-2 flex-1 min-w-0">
                  <p className="text-xs font-medium text-black dark:text-white truncate">
                    {user.name}
                  </p>
                </div>
              )}
            </div>

            {/* Logout Button */}
          </div>
        )}

        {/* Collapsed state - just show avatar */}
        {!user && !isExpanded && (
          <div className="flex items-center justify-center h-[32px]">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-[#e5e5e5] dark:bg-[#2a2a2a] text-[#878787] text-[10px] font-medium">
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </aside>
  );
}
