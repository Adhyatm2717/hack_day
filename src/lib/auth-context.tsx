"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ChargeMate — Auth context
// Provides the logged-in user's session and profile to all client components.
// Server components use cookies; this context keeps client state in sync.
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Profile } from "@/types/db";

export interface AuthUser {
  id:       string;
  phone:    string;
  profile:  Profile;
}

interface AuthContextValue {
  user:      AuthUser | null;
  isLoading: boolean;
  setUser:   (user: AuthUser | null) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children:    ReactNode;
  initialUser?: AuthUser | null;
}) {
  const [user, setUser]         = useState<AuthUser | null>(initialUser);
  const [isLoading, setLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // In mock mode, we just keep what's in memory.
      // In real mode this would re-fetch from Supabase.
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
