import { redirect } from "next/navigation";

interface LoginPageProps {
  params: { locale?: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function LoginPage({ params, searchParams }: LoginPageProps) {
  const localeSegment = params.locale || "en";
  const callbackParam = searchParams?.callbackUrl;
  const callbackUrl =
    typeof callbackParam === "string" && callbackParam.length > 0
      ? callbackParam
      : `/${localeSegment}`;
  const signInUrl = `/api/auth/signin/authentik?callbackUrl=${encodeURIComponent(
    callbackUrl
  )}`;

  redirect(signInUrl);
}
