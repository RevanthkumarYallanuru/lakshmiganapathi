import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

import { Button, Card, CardHeader, Input, Select, useToast } from "@/components/ui";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { NameDisplayMode, PrintLanguage } from "@/types";

export function SettingsPage() {
  const {
    user,
    business,
    logout,
    hasRole,
    setNameDisplayMode,
    setPrintLanguage,
    setProprietorName,
    setBillNote,
    setContactNumbers,
    setBillItemRowCount,
  } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [savingPrintLanguage, setSavingPrintLanguage] = useState(false);
  const [proprietorInput, setProprietorInput] = useState(business?.proprietor_name ?? "");
  const [savingProprietor, setSavingProprietor] = useState(false);
  const [billNoteInput, setBillNoteInput] = useState(business?.bill_note ?? "");
  const [savingBillNote, setSavingBillNote] = useState(false);
  const [phoneInput, setPhoneInput] = useState(business?.phone ?? "");
  const [alternatePhoneInput, setAlternatePhoneInput] = useState(
    business?.alternate_phone ?? ""
  );
  const [savingContactNumbers, setSavingContactNumbers] = useState(false);
  const [rowCountInput, setRowCountInput] = useState(
    String(business?.bill_item_row_count ?? 12)
  );
  const [savingRowCount, setSavingRowCount] = useState(false);

  useEffect(() => {
    setProprietorInput(business?.proprietor_name ?? "");
  }, [business?.proprietor_name]);

  useEffect(() => {
    setBillNoteInput(business?.bill_note ?? "");
  }, [business?.bill_note]);

  useEffect(() => {
    setPhoneInput(business?.phone ?? "");
  }, [business?.phone]);

  useEffect(() => {
    setAlternatePhoneInput(business?.alternate_phone ?? "");
  }, [business?.alternate_phone]);

  useEffect(() => {
    setRowCountInput(String(business?.bill_item_row_count ?? 12));
  }, [business?.bill_item_row_count]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  async function handleDisplayModeChange(value: string) {
    setSaving(true);
    try {
      await setNameDisplayMode(value as NameDisplayMode);
      toast({
        variant: "success",
        title: t("settings.nameDisplayModeUpdateSuccess"),
      });
    } catch {
      toast({ variant: "error", title: t("common.errorGeneric") });
    } finally {
      setSaving(false);
    }
  }

  async function handlePrintLanguageChange(value: string) {
    setSavingPrintLanguage(true);
    try {
      await setPrintLanguage(value as PrintLanguage);
      toast({
        variant: "success",
        title: t("settings.printLanguageUpdateSuccess"),
      });
    } catch {
      toast({ variant: "error", title: t("common.errorGeneric") });
    } finally {
      setSavingPrintLanguage(false);
    }
  }

  async function handleSaveContactNumbers() {
    setSavingContactNumbers(true);
    try {
      await setContactNumbers(phoneInput.trim(), alternatePhoneInput.trim());
      toast({
        variant: "success",
        title: t("settings.contactNumbersUpdateSuccess"),
      });
    } catch {
      toast({ variant: "error", title: t("common.errorGeneric") });
    } finally {
      setSavingContactNumbers(false);
    }
  }

  async function handleSaveProprietorName() {
    setSavingProprietor(true);
    try {
      await setProprietorName(proprietorInput.trim());
      toast({
        variant: "success",
        title: t("settings.proprietorNameUpdateSuccess"),
      });
    } catch {
      toast({ variant: "error", title: t("common.errorGeneric") });
    } finally {
      setSavingProprietor(false);
    }
  }

  async function handleSaveBillNote() {
    setSavingBillNote(true);
    try {
      await setBillNote(billNoteInput.trim());
      toast({
        variant: "success",
        title: t("settings.billNoteUpdateSuccess"),
      });
    } catch {
      toast({ variant: "error", title: t("common.errorGeneric") });
    } finally {
      setSavingBillNote(false);
    }
  }

  async function handleSaveRowCount() {
    const count = Math.min(15, Math.max(8, Number(rowCountInput) || 12));
    setSavingRowCount(true);
    try {
      await setBillItemRowCount(count);
      toast({
        variant: "success",
        title: t("settings.billRowCountUpdateSuccess"),
      });
    } catch {
      toast({ variant: "error", title: t("common.errorGeneric") });
    } finally {
      setSavingRowCount(false);
    }
  }

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h1 className="text-lg font-semibold text-slate-900">
        {t("settings.title")}
      </h1>

      <Card>
        <CardHeader title={t("settings.language")} />
        <LanguageToggle />
      </Card>

      <Card>
        <CardHeader title={t("settings.nameDisplayMode")} />
        <p className="mb-3 text-sm text-slate-500">
          {t("settings.nameDisplayModeHint")}
        </p>
        {hasRole("ADMIN") ? (
          <Select
            value={business?.name_display_mode ?? "ENGLISH"}
            onValueChange={handleDisplayModeChange}
            disabled={saving}
            options={[
              { value: "ENGLISH", label: t("settings.nameDisplayModeEnglish") },
              { value: "TELUGU", label: t("settings.nameDisplayModeTelugu") },
              { value: "BOTH", label: t("settings.nameDisplayModeBoth") },
            ]}
          />
        ) : (
          <p className="text-sm text-slate-400">
            {t("settings.nameDisplayModeAdminOnly")}
          </p>
        )}
      </Card>

      <Card>
        <CardHeader title={t("settings.printLanguage")} />
        <p className="mb-3 text-sm text-slate-500">
          {t("settings.printLanguageHint")}
        </p>
        {hasRole("ADMIN") ? (
          <Select
            value={business?.print_language ?? "ENGLISH"}
            onValueChange={handlePrintLanguageChange}
            disabled={savingPrintLanguage}
            options={[
              { value: "ENGLISH", label: t("settings.nameDisplayModeEnglish") },
              { value: "TELUGU", label: t("settings.nameDisplayModeTelugu") },
            ]}
          />
        ) : (
          <p className="text-sm text-slate-400">
            {t("settings.nameDisplayModeAdminOnly")}
          </p>
        )}
      </Card>

      <Card>
        <CardHeader title={t("settings.contactNumbers")} />
        <p className="mb-3 text-sm text-slate-500">
          {t("settings.contactNumbersHint")}
        </p>
        {hasRole("ADMIN") ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label={t("settings.primaryPhone")}
                value={phoneInput}
                onChange={(event) => setPhoneInput(event.target.value)}
                placeholder="9032081427"
              />
              <Input
                label={t("settings.alternatePhone")}
                optional
                value={alternatePhoneInput}
                onChange={(event) => setAlternatePhoneInput(event.target.value)}
                placeholder="9392424775"
              />
            </div>
            <Button
              size="md"
              className="self-end"
              onClick={handleSaveContactNumbers}
              loading={savingContactNumbers}
              disabled={
                phoneInput.trim() === (business?.phone ?? "") &&
                alternatePhoneInput.trim() === (business?.alternate_phone ?? "")
              }
            >
              {t("common.save")}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            {[business?.phone, business?.alternate_phone].filter(Boolean).join(" · ") ||
              t("settings.nameDisplayModeAdminOnly")}
          </p>
        )}
      </Card>

      <Card>
        <CardHeader title={t("settings.proprietorName")} />
        <p className="mb-3 text-sm text-slate-500">
          {t("settings.proprietorNameHint")}
        </p>
        {hasRole("ADMIN") ? (
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                value={proprietorInput}
                onChange={(event) => setProprietorInput(event.target.value)}
                placeholder={t("settings.proprietorNamePlaceholder")}
              />
            </div>
            <Button
              size="md"
              onClick={handleSaveProprietorName}
              loading={savingProprietor}
              disabled={proprietorInput.trim() === (business?.proprietor_name ?? "")}
            >
              {t("common.save")}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            {business?.proprietor_name || t("settings.nameDisplayModeAdminOnly")}
          </p>
        )}
      </Card>

      <Card>
        <CardHeader title={t("settings.billNote")} />
        <p className="mb-3 text-sm text-slate-500">
          {t("settings.billNoteHint")}
        </p>
        {hasRole("ADMIN") ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={billNoteInput}
              onChange={(event) => setBillNoteInput(event.target.value)}
              placeholder={t("settings.billNotePlaceholder")}
              maxLength={300}
              rows={3}
              className="w-full rounded-control border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 focus-visible:outline-offset-1"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {billNoteInput.length}/300
              </span>
              <Button
                size="md"
                onClick={handleSaveBillNote}
                loading={savingBillNote}
                disabled={billNoteInput.trim() === (business?.bill_note ?? "")}
              >
                {t("common.save")}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            {business?.bill_note || t("settings.nameDisplayModeAdminOnly")}
          </p>
        )}
      </Card>

      <Card>
        <CardHeader title={t("settings.billRowCount")} />
        <p className="mb-3 text-sm text-slate-500">
          {t("settings.billRowCountHint")}
        </p>
        {hasRole("ADMIN") ? (
          <div className="flex items-end gap-2">
            <div className="w-28">
              <Input
                type="number"
                min={8}
                max={15}
                value={rowCountInput}
                onChange={(event) => setRowCountInput(event.target.value)}
              />
            </div>
            <Button
              size="md"
              onClick={handleSaveRowCount}
              loading={savingRowCount}
              disabled={
                Number(rowCountInput) === (business?.bill_item_row_count ?? 12)
              }
            >
              {t("common.save")}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            {business?.bill_item_row_count ?? 12}
          </p>
        )}
      </Card>

      <Card>
        <CardHeader title={t("settings.account")} />
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-slate-500">{t("settings.loggedInAs")}</dt>
          <dd className="font-medium text-slate-800">{user?.name}</dd>
          <dt className="text-slate-500">{t("settings.business")}</dt>
          <dd className="font-medium text-slate-800">{business?.name}</dd>
          <dt className="text-slate-500">{t("settings.role")}</dt>
          <dd className="font-medium text-slate-800">{user?.role}</dd>
        </dl>
        <Button
          variant="outline"
          className="mt-4"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {t("auth.logout")}
        </Button>
      </Card>
    </div>
  );
}
