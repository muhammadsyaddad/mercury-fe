"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProviderClient } from "@/locales/client";
import { AuthProvider, CurrencyProvider } from "@/contexts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
} | null;

type ProviderProps = {
  locale: string;
  children: ReactNode;
  initialUser?: SessionUser;
};

/**
 * App-level providers.
 *
 * Order matters:
 * - QueryClientProvider must wrap any component that uses `useQuery` (e.g. CurrencyProvider).
 * - AuthProvider provides auth context used via `useAuth`.
 * - Theme and i18n providers handle UI concerns and must live on the client.
 */
export function Providers({ locale, children, initialUser }: ProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <I18nProviderClient locale={locale}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <QueryClientProvider client={queryClient}>
          <AuthProvider initialUser={initialUser}>
            <CurrencyProvider>{children}</CurrencyProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </I18nProviderClient>
  );
}
