"use client";

import { signIn, useSession } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const hasTriggeredSignIn = useRef(false);

  const localeSegment = pathname.split("/")[1] || "en";
  const defaultCallbackUrl = `/${localeSegment}`;
  const callbackUrl = searchParams.get("callbackUrl") || defaultCallbackUrl;
  const error = searchParams.get("error");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  useEffect(() => {
    if (
      status !== "unauthenticated" ||
      error ||
      hasTriggeredSignIn.current
    ) {
      return;
    }

    hasTriggeredSignIn.current = true;
    setIsLoading(true);
    signIn("authentik", { callbackUrl });
  }, [status, error, callbackUrl]);

  const handleLogin = () => {
    setIsLoading(true);
    signIn("authentik", { callbackUrl });
  };

  if (status === "loading" || isLoading || (status === "unauthenticated" && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
        <div className="w-6 h-6 border-2 border-[#878787] border-t-black dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
      <div className="w-full max-w-sm rounded-lg border border-[#e5e5e5] dark:border-[#2a2a2a] p-6 text-center">
        <h1 className="text-lg font-semibold text-black dark:text-white">
          Login failed
        </h1>
        <p className="text-sm text-[#878787] mt-2">
          {error === "OAuthCallback"
            ? "Authentication failed. Please try again."
            : error === "Configuration"
              ? "Server configuration error. Please contact support."
              : `Authentication error: ${error}`}
        </p>
        <button
          type="button"
          onClick={handleLogin}
          className="mt-4 inline-flex items-center justify-center h-10 px-4 rounded-md bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-[#333] dark:hover:bg-[#e5e5e5]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
