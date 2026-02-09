import type { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  /**
   * Extended to include accessToken
   */
  interface Session {
    accessToken?: string;
    user: {
      /** User ID from provider (Authentik) */
      name?: string | null;
      email?: string | null;
      image?: string | null;
      groups?: string[];
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    accessToken?: string;
    refreshToken?: string;
    groups?: string[]
  }
}

declare module "next-auth/jwt" {
  /** Extended to store tokens from callback */
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    groups?: string[];
  }
}
