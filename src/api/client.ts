import axios, { type AxiosError } from "axios";

import type { ApiErrorBody } from "@/types";
import { clearStoredSession, getStoredSession } from "@/lib/session";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export class ApiError extends Error {
  status?: number;
  fieldErrors?: { field: string; message: string }[];

  constructor(
    message: string,
    status?: number,
    fieldErrors?: { field: string; message: string }[]
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** Dispatched when a request comes back 401 so AuthContext can react
 * (clear state, redirect to /login) without this module importing
 * React Router or the auth context directly. */
export const SESSION_EXPIRED_EVENT = "auth:session-expired";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  // Without this, a request that never gets a response (a hung
  // connection, a server that never answers) would leave the calling
  // page's loading state spinning forever — React Query would never see
  // success or failure to react to. 30s sits above the backend's
  // worst-case Neon cold-start retry budget (~25s, see
  // config/database.ts), so a slow-but-successful request still
  // completes, and below the backend's 35s socket backstop, so a
  // timeout here is always a clean "request took too long" ApiError.
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const session = getStoredSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    // A 401 only means "session expired" if this request carried a
    // token in the first place (e.g. login itself returns 401 for a
    // wrong password, which is a normal form error, not an expired
    // session — that must not trigger a logout/redirect/toast).
    const hadToken = !!error.config?.headers?.Authorization;
    if (error.response?.status === 401 && hadToken) {
      clearStoredSession();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    // The backend's own error.middleware.ts already keeps its own
    // messages generic ("Internal server error", etc.) for anything
    // that isn't a deliberate validation message, so passing through
    // error.response?.data?.message can never leak database/backend
    // internals here either.
    const message =
      error.response?.data?.message ??
      (error.code === "ECONNABORTED"
        ? "The request took too long. Please try again."
        : error.code === "ERR_NETWORK"
          ? "Unable to reach the server. Check your connection and try again."
          : "Something went wrong. Please try again.");

    return Promise.reject(
      new ApiError(
        message,
        error.response?.status,
        error.response?.data?.errors
      )
    );
  }
);
