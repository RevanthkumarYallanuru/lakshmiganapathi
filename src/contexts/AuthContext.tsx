import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { login as loginRequest } from "@/api/endpoints/auth";
import { updateBusinessSettings } from "@/api/endpoints/business";
import { SESSION_EXPIRED_EVENT } from "@/api/client";
import {
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from "@/lib/session";
import type {
  AuthBusiness,
  AuthUser,
  NameDisplayMode,
  PrintLanguage,
  UserRole,
} from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  business: AuthBusiness | null;
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
  acknowledgeSessionExpired: () => void;
  /** Admin-only business-wide setting for how customer/item/category
   * names are displayed (English / Telugu / Both) — separate from the
   * app UI language. Persists to the server and updates every open
   * tab of this session immediately. */
  setNameDisplayMode: (mode: NameDisplayMode) => Promise<void>;
  /** Admin-only: which single language the printed bill/PDF uses for
   * customer and item names — independent of name_display_mode above,
   * so staff can see Both on screen while the printed copy always
   * goes out in one specific language for customers. */
  setPrintLanguage: (language: PrintLanguage) => Promise<void>;
  /** Admin-only: the proprietor's name shown on printed bills next to
   * the business phone number. */
  setProprietorName: (name: string) => Promise<void>;
  /** Admin-only: the free-text note printed near the bottom of the
   * bill/PDF (e.g. payment terms). Empty string clears it back to the
   * app's own default note. */
  setBillNote: (note: string) => Promise<void>;
  /** Admin-only: the business's two contact numbers, both shown in
   * the printed bill header. Updated together in one call since
   * they're edited from a single Settings form. */
  setContactNumbers: (phone: string, alternatePhone: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [business, setBusiness] = useState<AuthBusiness | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  useEffect(() => {
    const session = getStoredSession();
    if (session) {
      setUser(session.user);
      setBusiness(session.business);
    }
  }, []);

  useEffect(() => {
    function handleSessionExpired() {
      setUser(null);
      setBusiness(null);
      setIsSessionExpired(true);
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () =>
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await loginRequest(username, password);
    setStoredSession({
      token: result.token,
      user: result.user,
      business: result.business,
    });
    setUser(result.user);
    setBusiness(result.business);
    setIsSessionExpired(false);
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setUser(null);
    setBusiness(null);
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => !!user && roles.includes(user.role),
    [user]
  );

  const acknowledgeSessionExpired = useCallback(() => {
    setIsSessionExpired(false);
  }, []);

  const setNameDisplayMode = useCallback(
    async (mode: NameDisplayMode) => {
      const updated = await updateBusinessSettings({ name_display_mode: mode });
      setBusiness((prev) => {
        const next = prev ? { ...prev, name_display_mode: updated.name_display_mode } : prev;
        const session = getStoredSession();
        if (session && next) {
          setStoredSession({ ...session, business: next });
        }
        return next;
      });
    },
    []
  );

  const setPrintLanguage = useCallback(async (language: PrintLanguage) => {
    const updated = await updateBusinessSettings({ print_language: language });
    setBusiness((prev) => {
      const next = prev ? { ...prev, print_language: updated.print_language } : prev;
      const session = getStoredSession();
      if (session && next) {
        setStoredSession({ ...session, business: next });
      }
      return next;
    });
  }, []);

  const setProprietorName = useCallback(async (name: string) => {
    const updated = await updateBusinessSettings({ proprietor_name: name });
    setBusiness((prev) => {
      const next = prev ? { ...prev, proprietor_name: updated.proprietor_name } : prev;
      const session = getStoredSession();
      if (session && next) {
        setStoredSession({ ...session, business: next });
      }
      return next;
    });
  }, []);

  const setBillNote = useCallback(async (note: string) => {
    const updated = await updateBusinessSettings({ bill_note: note });
    setBusiness((prev) => {
      const next = prev ? { ...prev, bill_note: updated.bill_note } : prev;
      const session = getStoredSession();
      if (session && next) {
        setStoredSession({ ...session, business: next });
      }
      return next;
    });
  }, []);

  const setContactNumbers = useCallback(
    async (phone: string, alternatePhone: string) => {
      const updated = await updateBusinessSettings({
        phone,
        alternate_phone: alternatePhone,
      });
      setBusiness((prev) => {
        const next = prev
          ? { ...prev, phone: updated.phone, alternate_phone: updated.alternate_phone }
          : prev;
        const session = getStoredSession();
        if (session && next) {
          setStoredSession({ ...session, business: next });
        }
        return next;
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      business,
      isAuthenticated: !!user,
      isSessionExpired,
      login,
      logout,
      hasRole,
      acknowledgeSessionExpired,
      setNameDisplayMode,
      setPrintLanguage,
      setProprietorName,
      setBillNote,
      setContactNumbers,
    }),
    [
      user,
      business,
      isSessionExpired,
      login,
      logout,
      hasRole,
      acknowledgeSessionExpired,
      setNameDisplayMode,
      setPrintLanguage,
      setProprietorName,
      setBillNote,
      setContactNumbers,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
