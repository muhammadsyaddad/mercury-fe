"use client";

import { signOut } from "next-auth/react";
import { Button } from "@vision_dashboard/ui/button";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function LogoutButton({
  variant = "outline",
  size = "sm",
  className,
  showIcon = false,
  children = "Logout",
}: LogoutButtonProps) {
  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <Button variant={variant} size={size} className={className} onClick={handleLogout}>
      {showIcon && <LogOut className="h-4 w-4 mr-2" />}
      {children}
    </Button>
  );
}
