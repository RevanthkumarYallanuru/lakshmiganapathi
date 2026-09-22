import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Button,
  ConfirmDialog,
  Dialog,
  Input,
  Select,
  TeluguSuggestion,
} from "@/components/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import type { Category, Item } from "@/types";

const schema = z.object({
  item_code: z.string().trim().min(1, "Required").max(30),
  english_name: z.string().trim().min(1, "Required").max(150),
  telugu_name: z.string().trim().max(150).optional(),
  category_id: z.string().optional(),
  description: z.string().trim().max(1000).optional(),
});

export type ItemFormValues = z.infer<typeof schema>;

export function ItemFormDialog({
  open,
  onOpenChange,
  item,
  categories,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
  categories: Category[];
  onSubmit: (values: ItemFormValues) => void;
  isSubmitting: boolean;
}) {
  const { t } = useLanguage();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      item_code: "",
      english_name: "",
      telugu_name: "",
      category_id: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        item_code: item?.item_code ?? "",
        english_name: item?.english_name ?? "",
        telugu_name: item?.telugu_name ?? "",
        category_id: item?.category_id ?? "",
        description: item?.description ?? "",
      });
    }
  }, [open, item, reset]);

  const { confirmOpen, setConfirmOpen, requestClose, confirmDiscard } =
    useDiscardConfirm(isDirty, onOpenChange);

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  return (
    <>
    <Dialog
      open={open}
      onOpenChange={requestClose}
      title={item ? t("items.edit") : t("items.new")}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t("items.code")}
            autoFocus
            error={errors.item_code?.message}
            {...register("item_code")}
          />
          <Controller
            control={control}
            name="category_id"
            render={({ field }) => (
              <Select
                label={t("items.category")}
                optional
                value={field.value}
                onValueChange={field.onChange}
                options={categoryOptions}
                placeholder={t("items.noCategory")}
              />
            )}
          />
        </div>

        <Input
          label={t("items.englishName")}
          error={errors.english_name?.message}
          {...register("english_name")}
        />

        <div className="flex flex-col gap-1.5">
          <Input
            label={t("items.teluguName")}
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

        <Input
          label={t("items.description")}
          optional
          error={errors.description?.message}
          {...register("description")}
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
            {item ? t("common.save") : t("common.create")}
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
