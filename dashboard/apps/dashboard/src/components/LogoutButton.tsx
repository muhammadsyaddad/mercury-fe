"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@vision_dashboard/ui/button";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      // redirect to login page after logout
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed", err);
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleLogout} disabled={loading}>
      {loading ? "Logging out..." : "Logout"}
    </Button>
  );
}
