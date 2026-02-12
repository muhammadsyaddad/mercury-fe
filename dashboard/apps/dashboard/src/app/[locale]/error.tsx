"use client";

import { Button } from "@vision_dashboard/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="h-[calc(100vh-200px)] w-full">
      <div className="mt-8 flex flex-col items-center justify-center h-full">
        <div className="bg-gradient-to-br from-red-50/60 to-orange-50/30 dark:from-red-950/20 dark:to-orange-950/10 rounded-2xl p-10 flex flex-col items-center text-center mb-8 border border-red-200/40 dark:border-red-800/30">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center ring-1 ring-red-200 dark:ring-red-800 mb-6">
            <AlertTriangle className="h-8 w-8 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold mb-3 text-red-900 dark:text-red-100">Something went wrong</h2>
          <p className="text-sm text-red-700/60 dark:text-red-300/60 max-w-sm">
            An unexpected error has occurred. Please try again
            <br /> or contact support if the issue persists.
          </p>
        </div>

        <div className="flex space-x-4">
          <Button onClick={() => reset()} variant="outline">
            Try again
          </Button>

          <Link href="/account/support">
            <Button>Contact us</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
