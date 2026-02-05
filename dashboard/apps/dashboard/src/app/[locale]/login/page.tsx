import Link from "next/link";
import { redirect } from "next/navigation";

interface LoginPageProps {
  params: Promise<{ locale?: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({
  params,
  searchParams,
}: LoginPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const localeSegment = resolvedParams.locale || "en";
  const callbackParam = resolvedSearchParams.callbackUrl;
  const errorParam = resolvedSearchParams.error;
  const callbackUrl =
    typeof callbackParam === "string" && callbackParam.length > 0
      ? callbackParam
      : `/${localeSegment}`;
  const signInUrl = `/api/auth/signin/authentik?callbackUrl=${encodeURIComponent(
    callbackUrl
  )}`;

  if (!errorParam) {
    redirect(signInUrl);
  }

  const errorMessage =
    errorParam === "OAuthCallback"
      ? "Authentication failed. Please try again."
      : errorParam === "Configuration"
        ? "Server configuration error. Please contact support."
        : `Authentication error: ${String(errorParam)}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm rounded-lg border border-[#e5e5e5] p-6 text-center">
        <h1 className="text-lg font-semibold text-black">Login failed</h1>
        <p className="text-sm text-[#878787] mt-2">{errorMessage}</p>
        <Link
          href={signInUrl}
          className="mt-4 inline-flex items-center justify-center h-10 px-4 rounded-md bg-black text-white text-sm font-medium hover:bg-[#333]"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}
