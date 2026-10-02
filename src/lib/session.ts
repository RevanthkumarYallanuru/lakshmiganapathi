import type { AuthBusiness, AuthUser } from "@/types";

const STORAGE_KEY = "lge_session";

export interface StoredSession {
  token: string;
  user: AuthUser;
  business: AuthBusiness;
}

export function getStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession> | null;
    // A malformed entry (e.g. a token-less session) would otherwise
    // hydrate as "logged in" while every request went out without an
    // Authorization header — and the API client deliberately ignores a
    // 401 on a token-less request, so nothing would ever log it out.
    // Treat anything incomplete as no session at all.
    if (
      !parsed ||
      typeof parsed.token !== "string" ||
      !parsed.token ||
      !parsed.user ||
      !parsed.business
    ) {
      return null;
    }
    return parsed as StoredSession;
  } catch {
    return null;
  }
}

export function setStoredSession(session: StoredSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
