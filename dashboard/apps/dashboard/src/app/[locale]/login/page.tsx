"use client";

// Using OIDC SSO flow: redirect to server route that starts Authentik authorize flow
import { Button } from "@vision_dashboard/ui/button";
import { Input } from "@vision_dashboard/ui/input";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSSO = () => {
    setIsLoading(true);
    // Force full-page navigation so server redirect to IdP is followed correctly
    window.location.href = '/api/auth/login';
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white dark:bg-[#0a0a0a]">
        {/* Logo at top */}
        {/*<div className="p-6">
          <div className="flex items-center gap-2">
            <Icons.LogoSmall />
            <span className="text-sm font-medium text-black dark:text-white">
              Vision Dashboard
            </span>
          </div>
        </div>*/}

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
                {error}
              </div>
            )}

            {/* SSO Login Button */}
            <div className="space-y-4">
              <Button
                onClick={startSSO}
                disabled={isLoading}
                className="w-full h-10 bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-[#333] dark:hover:bg-[#e5e5e5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-[#878787] border-t-white dark:border-t-black rounded-full animate-spin" />
                ) : (
                  "Sign in with Authentik"
                )}
              </Button>
            </div>

            {/* Demo Credentials */}
            {/*<div className="mt-6 text-center text-[10px] text-[#878787]">
              <p>Demo: zap@test.com / zap123</p>
            </div>*/}
          </div>
        </div>
      </div>

      {/* Right side - Background Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-[#1a1a1a]">
        <Image
          src="https://images.unsplash.com/photo-1768697581060-52e2edbee7fa?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"//
          alt="Login background"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
