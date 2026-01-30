"use client";

import { signIn, useSession } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@vision_dashboard/ui/button";
import Image from "next/image";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const localeSegment = pathname.split("/")[1] || "en";
  const defaultCallbackUrl = `/${localeSegment}`;
  const callbackUrl = searchParams.get("callbackUrl") || defaultCallbackUrl;
  const error = searchParams.get("error");

  // If authenticated, redirect to callback URL
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const handleLogin = () => {
    setIsLoading(true);
    signIn("authentik", { callbackUrl });
  };

  // Show loading while checking auth status
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
        <div className="w-6 h-6 border-2 border-[#878787] border-t-black dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white dark:bg-[#0a0a0a]">
        {/* Form centered */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-xl font-medium text-black dark:text-white mb-1">
                Login to your account
              </h1>
              <p className="text-xs text-[#878787]">
                Enter your email below to login to your account
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-[#fafafa] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#2a2a2a] rounded-md text-xs text-black dark:text-white text-center">
                {error === "OAuthCallback" 
                  ? "Authentication failed. Please try again."
                  : error === "Configuration"
                  ? "Server configuration error. Please contact support."
                  : `Authentication error: ${error}`}
              </div>
            )}

            {/* SSO Login Button */}
            <div className="space-y-4">
              <Button
                onClick={handleLogin}
                disabled={isLoading || status === "authenticated"}
                className="w-full h-10 bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-[#333] dark:hover:bg-[#e5e5e5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-[#878787] border-t-white dark:border-t-black rounded-full animate-spin" />
                ) : (
                  "Sign in with Authentik"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Background Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-[#1a1a1a]">
        <Image
          src="https://images.unsplash.com/photo-1768697581060-52e2edbee7fa?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Login background"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
