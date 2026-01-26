"use client";

import { type User as UserType, getSession, logout } from "@/lib/auth";
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

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Fetch user session on mount
    const fetchUser = async () => {
      try {
        const session = await getSession();
        setUser(session);
      } catch (e) {
        console.error("Failed to fetch session", e);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
    router.refresh();
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
        <Link href="/" className="flex items-center justify-center w-[60px]">
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
                "flex items-center h-[32px] rounded-md transition-colors",
                isExpanded ? "px-2" : "justify-center",
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
            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                "flex items-center h-[32px] rounded-md transition-colors text-[#878787] hover:text-black dark:hover:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#1a1a1a]",
                isExpanded ? "px-2" : "justify-center",
              )}
              title="Sign out"
            >
              <LogOut size={16} className="flex-shrink-0" />
              {isExpanded && (
                <span className="ml-2 text-xs font-medium">Sign out</span>
              )}
            </button>
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
