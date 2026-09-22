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

    const message =
      error.response?.data?.message ??
      (error.code === "ERR_NETWORK"
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
