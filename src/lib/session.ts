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
    return JSON.parse(raw) as StoredSession;
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
