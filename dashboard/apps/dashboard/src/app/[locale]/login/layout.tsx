"use client";

import { SessionProvider } from "next-auth/react";
import { Suspense } from "react";
import { Spinner } from "@vision_dashboard/ui/spinner";
import { SessionDataProvider } from "@/contexts/SessionContext";

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <Spinner className="h-12 w-12 mb-4" />
      <p className="text-gray-500 dark:text-gray-400">Loading...</p>
    </div>
  );
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <SessionDataProvider>
        <Suspense fallback={<LoadingFallback />}>
          {children}
        </Suspense>
      </SessionDataProvider>
    </SessionProvider>
  );
}
