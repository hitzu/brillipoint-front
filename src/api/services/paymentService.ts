import {
  CreatePaymentPayload,
  Payment,
  PaymentReceiptUploadUrl,
  UpdatePaymentPayload,
} from "../../interfaces";

import { axiosInstanceWithToken } from "../config/axiosConfig";

export const createPayment = async (
  payload: CreatePaymentPayload
): Promise<Payment> => {
  try {
    const contractId = payload.contractId;
    const response = await axiosInstanceWithToken.post<Payment>(
      `/contracts/${contractId}/payments`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Error creating payment:", error);
    throw error;
  }
};

export const getPayments = async (contractId: number): Promise<Payment[]> => {
  try {
    const response = await axiosInstanceWithToken.get<Payment[]>(
      `/contracts/${contractId}/payments`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching payments:", error);
    throw error;
  }
};

export const updatePayment = async (
  contractId: number,
  paymentId: number,
  payload: UpdatePaymentPayload
): Promise<Payment> => {
  const response = await axiosInstanceWithToken.patch<Payment>(
    `/contracts/${contractId}/payments/${paymentId}`,
    payload
  );
  return response.data;
};

export const deletePayment = async (
  contractId: number,
  paymentId: number
): Promise<void> => {
  await axiosInstanceWithToken.delete(
    `/contracts/${contractId}/payments/${paymentId}`
  );
};

export const PAYMENT_RECEIPT_MIME = "application/pdf";
export const PAYMENT_RECEIPT_MAX_BYTES = 10 * 1024 * 1024;

/** Returns a user-facing error message, or `null` when the file is valid. */
export const validatePaymentReceiptFile = (file: {
  type: string;
  size: number;
}): string | null => {
  if (file.type !== PAYMENT_RECEIPT_MIME) {
    return "El comprobante debe ser un archivo PDF";
  }
  if (file.size > PAYMENT_RECEIPT_MAX_BYTES) {
    return "El comprobante no puede pesar más de 10 MB";
  }
  return null;
};

export const createPaymentReceiptUploadUrl = async (
  contractId: number,
  file: { name: string; type: string; size: number }
): Promise<PaymentReceiptUploadUrl> => {
  const response = await axiosInstanceWithToken.post<PaymentReceiptUploadUrl>(
    `/contracts/${contractId}/payments/receipt-upload-url`,
    { fileName: file.name, mime: file.type, size: file.size }
  );
  return response.data;
};

/**
 * Uploads a PDF receipt straight to the private bucket and returns the
 * object path to send as `receiptPath` when creating or editing a payment.
 */
export const uploadPaymentReceipt = async (
  contractId: number,
  file: File
): Promise<string> => {
  const invalid = validatePaymentReceiptFile(file);
  if (invalid) {
    throw new Error(invalid);
  }
  const { path, signedUrl } = await createPaymentReceiptUploadUrl(
    contractId,
    file
  );
  const res = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": PAYMENT_RECEIPT_MIME },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`Receipt upload failed with status ${res.status}`);
  }
  return path;
};
