import "@/styles/globals.css";
import { cn } from "@vision_dashboard/ui/cn";
import "@vision_dashboard/ui/globals.css";
import { Toaster } from "@vision_dashboard/ui/toaster";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Lora } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactElement } from "react";
import { Providers } from "./providers";
import { getSession } from "@/lib/action";



const lora = Lora({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)" },
    { media: "(prefers-color-scheme: dark)" },
  ],
};

export default async function Layout({
  children,
  params,
}: {
  children: ReactElement;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(
          `${GeistSans.variable} ${GeistMono.variable} ${lora.variable} font-sans`,
          "whitespace-pre-line overscroll-none antialiased",
        )}
      >
        <NuqsAdapter>
          <Providers locale={locale} initialUser={session}>{children}</Providers>
          <Toaster />
        </NuqsAdapter>
      </body>
    </html>
  );
}
