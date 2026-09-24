import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Button,
  ConfirmDialog,
  Dialog,
  Input,
  TeluguSuggestion,
} from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import type { Supplier } from "@/types";

const schema = z.object({
  name: z.string().trim().min(1, "Required").max(150),
  telugu_name: z.string().trim().max(150).optional(),
  phone: z.string().trim().max(20).optional(),
  alternate_phone: z.string().trim().max(20).optional(),
  organization: z.string().trim().max(150).optional(),
  address: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(1000).optional(),
  // Kept as a plain string (not z.coerce.number()) to avoid a
  // known RHF+Zod resolver input/output type mismatch on coerced
  // fields — converted to a number at submission time instead
  // (see SuppliersPage.tsx's createMutation).
  initial_balance: z.string().trim().optional(),
});

export type SupplierFormValues = z.infer<typeof schema>;

export function SupplierFormDialog({
  open,
  onOpenChange,
  supplier,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onSubmit: (values: SupplierFormValues) => void;
  isSubmitting: boolean;
}) {
  const { t } = useLanguage();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      telugu_name: "",
      phone: "",
      alternate_phone: "",
      organization: "",
      address: "",
      notes: "",
      initial_balance: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: supplier?.name ?? "",
        telugu_name: supplier?.telugu_name ?? "",
        phone: supplier?.phone ?? "",
        alternate_phone: supplier?.alternate_phone ?? "",
        organization: supplier?.organization ?? "",
        address: supplier?.address ?? "",
        notes: supplier?.notes ?? "",
        initial_balance: undefined,
      });
    }
  }, [open, supplier, reset]);

  const { confirmOpen, setConfirmOpen, requestClose, confirmDiscard } =
    useDiscardConfirm(isDirty, onOpenChange);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={requestClose}
        title={supplier ? t("suppliers.edit") : t("suppliers.new")}
        size="lg"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <Input
            label={t("suppliers.name")}
            autoFocus
            error={errors.name?.message}
            {...register("name")}
          />

          <div className="flex flex-col gap-1.5">
            <Input
              label={t("suppliers.teluguName")}
              optional
              error={errors.telugu_name?.message}
              {...register("telugu_name")}
            />
            <TeluguSuggestion
              englishValue={watch("name") ?? ""}
              onAccept={(value) =>
                setValue("telugu_name", value, { shouldDirty: true })
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t("common.phone")}
              optional
              error={errors.phone?.message}
              {...register("phone")}
            />
            <Input
              label={t("suppliers.alternatePhone")}
              optional
              error={errors.alternate_phone?.message}
              {...register("alternate_phone")}
            />
          </div>

          <Input
            label={t("suppliers.organization")}
            optional
            error={errors.organization?.message}
            {...register("organization")}
          />

          <Input
            label={t("common.address")}
            optional
            error={errors.address?.message}
            {...register("address")}
          />

          <Input
            label={t("common.notes")}
            optional
            error={errors.notes?.message}
            {...register("notes")}
          />

          {!supplier && (
            <Input
              label={t("suppliers.initialBalance")}
              type="number"
              min="0"
              step="1"
              optional
              error={errors.initial_balance?.message}
              {...register("initial_balance")}
            />
          )}

          <div className="mt-1 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => requestClose(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {supplier ? t("common.save") : t("common.create")}
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("common.discardChangesTitle")}
        description={t("common.discardChangesDescription")}
        confirmLabel={t("common.discardChanges")}
        cancelLabel={t("common.keepEditing")}
        onConfirm={confirmDiscard}
      />
    </>
  );
}
