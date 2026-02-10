"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { SessionDataProvider } from "@/contexts/SessionContext";

export default function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
        },
      })
  );
  return (
    <SessionProvider
      session={session}
      refetchOnWindowFocus={false}
      refetchInterval={0}
    >
      <SessionDataProvider>
        <QueryClientProvider client={queryClient}>
          <CurrencyProvider>{children}</CurrencyProvider>
        </QueryClientProvider>
      </SessionDataProvider>
    </SessionProvider>
  );
}
