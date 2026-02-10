"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSession, type Session } from "next-auth/react";

type SessionState = {
  session: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
};

const SessionDataContext = createContext<SessionState | undefined>(undefined);

export function SessionDataProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  return (
    <SessionDataContext.Provider value={{ session, status }}>
      {children}
    </SessionDataContext.Provider>
  );
}

export function useSessionData() {
  const context = useContext(SessionDataContext);

  if (!context) {
    return { session: null, status: "loading" as const };
  }

  return context;
}
