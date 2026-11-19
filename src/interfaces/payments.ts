export type PaymentMethod = "cash" | "transfer" | "card";

export interface Payment {
  id: number;
  contractId: number;
  amount: number;
  method: PaymentMethod;
  status?: string;
  receivedAt: string;
  note: string | null;
  reference: string | null;
  /** Short-lived signed URL of the PDF receipt, when the payment has one. */
  receiptUrl?: string | null;
}

export interface CreatePaymentPayload {
  contractId: number;
  amount: number;
  method: PaymentMethod;
  receivedAt: string;
  note?: string;
  reference?: string;
  receiptPath?: string | null;
}

export interface UpdatePaymentPayload {
  amount?: number;
  method?: PaymentMethod;
  receivedAt?: string;
  note?: string | null;
  reference?: string | null;
  /** `null` removes the receipt; omit to keep it. */
  receiptPath?: string | null;
}

export interface PaymentReceiptUploadUrl {
  path: string;
  signedUrl: string;
  token: string;
}
