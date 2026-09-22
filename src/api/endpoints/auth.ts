import { api } from "@/api/client";
import type { ApiEnvelope, AuthBusiness, AuthUser } from "@/types";

export interface LoginResponse {
  token: string;
  user: AuthUser;
  business: AuthBusiness;
}

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  const { data } = await api.post<ApiEnvelope<LoginResponse>>(
    "/auth/login",
    { username, password }
  );
  return data.data;
}

export async function me(): Promise<AuthUser & { businesses: AuthBusiness }> {
  const { data } = await api.get<
    ApiEnvelope<AuthUser & { businesses: AuthBusiness }>
  >("/auth/me");
  return data.data;
}
