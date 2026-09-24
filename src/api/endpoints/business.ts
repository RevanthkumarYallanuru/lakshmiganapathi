import { api } from "@/api/client";
import type { ApiEnvelope, NameDisplayMode, PrintLanguage } from "@/types";

export interface BusinessSettings {
  id: string;
  name: string;
  name_display_mode: NameDisplayMode;
  print_language: PrintLanguage;
  proprietor_name: string | null;
  bill_note: string | null;
  phone: string | null;
  alternate_phone: string | null;
  bill_item_row_count: number;
}

export interface UpdateBusinessSettingsInput {
  name_display_mode?: NameDisplayMode;
  print_language?: PrintLanguage;
  proprietor_name?: string;
  bill_note?: string;
  phone?: string;
  alternate_phone?: string;
  bill_item_row_count?: number;
}

export async function getBusinessSettings(): Promise<BusinessSettings> {
  const { data } = await api.get<ApiEnvelope<BusinessSettings>>(
    "/business/settings"
  );
  return data.data;
}

export async function updateBusinessSettings(
  input: UpdateBusinessSettingsInput
): Promise<BusinessSettings> {
  const { data } = await api.patch<ApiEnvelope<BusinessSettings>>(
    "/business/settings",
    input
  );
  return data.data;
}
