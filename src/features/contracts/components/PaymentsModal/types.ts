import type { PaymentMethod, UpdatePaymentPayload } from "../../../../interfaces";
import { PAYMENT_METHOD_LABELS } from "../../../../shared/constants/paymentMethods";

export { PAYMENT_METHOD_LABELS };

export interface PaymentFormValues {
  amount: string;
  method: PaymentMethod;
  receivedAt: string;
  note: string;
  reference: string;
}

export interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
}

export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = (
  Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]
).map(([value, label]) => ({ value, label }));

/** What the form emits; the modal decides whether it creates or edits. */
export type PaymentFormPayload = Required<
  Pick<UpdatePaymentPayload, "amount" | "method" | "receivedAt">
> &
  Pick<UpdatePaymentPayload, "note" | "reference" | "receiptPath">;
