"use client";

import { login } from "@/lib/auth";
import { Button } from "@vision_dashboard/ui/button";
import { Input } from "@vision_dashboard/ui/input";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

type LoginFormData = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await login(data.email, data.password);

      if (!result.success) {
        setError(result.error || "Login failed");
        setIsLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
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

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-black dark:text-white mb-1.5"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  {...register("email", { required: "Email is required" })}
                  className="h-10 bg-white dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#2a2a2a] text-black dark:text-white placeholder:text-[#878787] focus:border-black dark:focus:border-white focus:ring-0 text-sm"
                  placeholder="m@example.com"
                />
                {errors.email && (
                  <p className="text-[#878787] text-xs mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-black dark:text-white mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password", {
                      required: "Password is required",
                    })}
                    className="h-10 pr-10 bg-white dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#2a2a2a] text-black dark:text-white placeholder:text-[#878787] focus:border-black dark:focus:border-white focus:ring-0 text-sm"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#878787] hover:text-black dark:hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[#878787] text-xs mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-[#333] dark:hover:bg-[#e5e5e5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-[#878787] border-t-white dark:border-t-black rounded-full animate-spin" />
                ) : (
                  "Login"
                )}
              </Button>
            </form>

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
