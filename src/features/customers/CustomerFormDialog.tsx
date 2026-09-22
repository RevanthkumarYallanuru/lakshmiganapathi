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
import type { Customer } from "@/types";

const schema = z.object({
  customer_code: z.string().trim().min(1, "Required").max(50),
  english_name: z.string().trim().min(1, "Required").max(150),
  telugu_name: z.string().trim().max(150).optional(),
  phone: z.string().trim().max(20).optional(),
  alternate_phone: z.string().trim().max(20).optional(),
  place: z.string().trim().max(150).optional(),
  address: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export type CustomerFormValues = z.infer<typeof schema>;

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onSubmit: (values: CustomerFormValues) => void;
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
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_code: "",
      english_name: "",
      telugu_name: "",
      phone: "",
      alternate_phone: "",
      place: "",
      address: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        customer_code: customer?.customer_code ?? "",
        english_name: customer?.english_name ?? "",
        telugu_name: customer?.telugu_name ?? "",
        phone: customer?.phone ?? "",
        alternate_phone: customer?.alternate_phone ?? "",
        place: customer?.place ?? "",
        address: customer?.address ?? "",
        notes: customer?.notes ?? "",
      });
    }
  }, [open, customer, reset]);

  const { confirmOpen, setConfirmOpen, requestClose, confirmDiscard } =
    useDiscardConfirm(isDirty, onOpenChange);

  return (
    <>
    <Dialog
      open={open}
      onOpenChange={requestClose}
      title={customer ? t("customers.edit") : t("customers.new")}
      size="lg"
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t("customers.code")}
            autoFocus
            error={errors.customer_code?.message}
            {...register("customer_code")}
          />
          <Input
            label={t("common.phone")}
            optional
            error={errors.phone?.message}
            {...register("phone")}
          />
        </div>

        <Input
          label={t("customers.englishName")}
          error={errors.english_name?.message}
          {...register("english_name")}
        />

        <div className="flex flex-col gap-1.5">
          <Input
            label={t("customers.teluguName")}
            optional
            error={errors.telugu_name?.message}
            {...register("telugu_name")}
          />
          <TeluguSuggestion
            englishValue={watch("english_name") ?? ""}
            onAccept={(value) =>
              setValue("telugu_name", value, { shouldDirty: true })
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t("customers.alternatePhone")}
            optional
            error={errors.alternate_phone?.message}
            {...register("alternate_phone")}
          />
          <Input
            label={t("customers.place")}
            optional
            error={errors.place?.message}
            {...register("place")}
          />
        </div>

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

        <div className="mt-1 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => requestClose(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {customer ? t("common.save") : t("common.create")}
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
