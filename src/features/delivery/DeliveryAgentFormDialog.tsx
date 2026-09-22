import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button, ConfirmDialog, Dialog, Input } from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import type { DeliveryAgent } from "@/types";

const schema = z.object({
  name: z.string().trim().min(1, "Required").max(100),
  phone: z.string().trim().max(20).optional(),
  vehicle_number: z.string().trim().max(30).optional(),
  notes: z.string().trim().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

export function DeliveryAgentFormDialog({
  open,
  onOpenChange,
  agent,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: DeliveryAgent | null;
  onSubmit: (values: FormValues) => void;
  isSubmitting: boolean;
}) {
  const { t } = useLanguage();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", vehicle_number: "", notes: "" },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: agent?.name ?? "",
        phone: agent?.phone ?? "",
        vehicle_number: agent?.vehicle_number ?? "",
        notes: agent?.notes ?? "",
      });
    }
  }, [open, agent, reset]);

  const { confirmOpen, setConfirmOpen, requestClose, confirmDiscard } =
    useDiscardConfirm(isDirty, onOpenChange);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={requestClose}
        title={agent ? t("delivery.editAgent") : t("delivery.newAgent")}
        size="sm"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <Input
            label={t("delivery.agentName")}
            autoFocus
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label={t("delivery.agentPhone")}
            optional
            error={errors.phone?.message}
            {...register("phone")}
          />
          <Input
            label={t("delivery.vehicleNumber")}
            optional
            error={errors.vehicle_number?.message}
            {...register("vehicle_number")}
          />
          <Input
            label={t("delivery.agentNotes")}
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
              {agent ? t("common.save") : t("common.create")}
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
