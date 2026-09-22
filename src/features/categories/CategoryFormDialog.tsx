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
import type { Category } from "@/types";

const schema = z.object({
  name: z.string().trim().min(1, "Required").max(100),
  telugu_name: z.string().trim().max(100).optional(),
});

type FormValues = z.infer<typeof schema>;

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSubmit: (values: FormValues) => void;
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
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", telugu_name: "" },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: category?.name ?? "",
        telugu_name: category?.telugu_name ?? "",
      });
    }
  }, [open, category, reset]);

  const { confirmOpen, setConfirmOpen, requestClose, confirmDiscard } =
    useDiscardConfirm(isDirty, onOpenChange);

  return (
    <>
    <Dialog
      open={open}
      onOpenChange={requestClose}
      title={category ? t("categories.edit") : t("categories.new")}
      size="sm"
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Input
          label={t("categories.name")}
          autoFocus
          error={errors.name?.message}
          {...register("name")}
        />
        <div className="flex flex-col gap-1.5">
          <Input
            label={t("customers.teluguName")}
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

        <div className="mt-1 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => requestClose(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {category ? t("common.save") : t("common.create")}
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
