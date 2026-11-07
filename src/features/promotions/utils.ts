import { CreatePromotionPayload, PromotionDetail } from "../../interfaces";
import { PromotionFormValues } from "./components/PromotionForm";

const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

export const detailToFormValues = (promotion: PromotionDetail): PromotionFormValues => ({
  brandId: promotion.brandId,
  name: promotion.name,
  type: promotion.type,
  value: String(promotion.value),
  status: promotion.status,
  validFrom: toDateInput(promotion.validFrom),
  validUntil: toDateInput(promotion.validUntil),
});

export const formValuesToPayload = (values: PromotionFormValues): CreatePromotionPayload => ({
  brandId: values.brandId as number,
  name: values.name.trim(),
  type: values.type,
  value: parseFloat(values.value),
  status: values.status,
  ...(values.validFrom && { validFrom: values.validFrom }),
  ...(values.validUntil && { validUntil: values.validUntil }),
});

export const apiErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { message?: string | string[] } } })?.response
    ?.data?.message;
  if (Array.isArray(message)) return message.join(", ");
  return message || fallback;
};
