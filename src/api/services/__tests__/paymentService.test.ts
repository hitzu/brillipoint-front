import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../config/axiosConfig", () => ({
  axiosInstanceWithToken: {
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { axiosInstanceWithToken } from "../../config/axiosConfig";
import {
  deletePayment,
  updatePayment,
  uploadPaymentReceipt,
  validatePaymentReceiptFile,
} from "../paymentService";

const http = axiosInstanceWithToken as unknown as {
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

beforeEach(() => {
  http.post.mockReset();
  http.patch.mockReset();
  http.delete.mockReset();
  fetchMock.mockReset();
});

afterAll(() => {
  vi.unstubAllGlobals();
});

const pdf = (size = 1000) =>
  new File([new Uint8Array(size)], "comprobante.pdf", {
    type: "application/pdf",
  });

describe("validatePaymentReceiptFile", () => {
  it("accepts a PDF up to 10 MB", () => {
    expect(validatePaymentReceiptFile({ type: "application/pdf", size: 10 * 1024 * 1024 })).toBeNull();
  });

  it("rejects non-PDF files and files over 10 MB", () => {
    expect(validatePaymentReceiptFile({ type: "image/png", size: 10 })).toMatch(/PDF/);
    expect(
      validatePaymentReceiptFile({ type: "application/pdf", size: 10 * 1024 * 1024 + 1 })
    ).toMatch(/10 MB/);
  });
});

describe("uploadPaymentReceipt", () => {
  it("asks for a signed URL, PUTs the PDF and returns the object path", async () => {
    http.post.mockResolvedValueOnce({
      data: { path: "payments/7/u_comprobante.pdf", signedUrl: "https://s/put", token: "t" },
    });
    fetchMock.mockResolvedValueOnce({ ok: true });
    const file = pdf();

    const path = await uploadPaymentReceipt(7, file);

    expect(path).toBe("payments/7/u_comprobante.pdf");
    expect(http.post).toHaveBeenCalledWith("/contracts/7/payments/receipt-upload-url", {
      fileName: "comprobante.pdf",
      mime: "application/pdf",
      size: 1000,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://s/put",
      expect.objectContaining({ method: "PUT", body: file })
    );
  });

  it("does not hit the API for a non-PDF file", async () => {
    const png = new File(["x"], "a.png", { type: "image/png" });

    await expect(uploadPaymentReceipt(7, png)).rejects.toThrow(/PDF/);
    expect(http.post).not.toHaveBeenCalled();
  });

  it("fails when the storage upload is rejected", async () => {
    http.post.mockResolvedValueOnce({
      data: { path: "p", signedUrl: "https://s/put", token: "t" },
    });
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });

    await expect(uploadPaymentReceipt(7, pdf())).rejects.toThrow(/403/);
  });
});

describe("updatePayment / deletePayment", () => {
  it("PATCHes the payment of the contract", async () => {
    http.patch.mockResolvedValueOnce({ data: { id: 5 } });

    await updatePayment(7, 5, { amount: 10, receiptPath: null });

    expect(http.patch).toHaveBeenCalledWith("/contracts/7/payments/5", {
      amount: 10,
      receiptPath: null,
    });
  });

  it("DELETEs the payment of the contract", async () => {
    http.delete.mockResolvedValueOnce({});

    await deletePayment(7, 5);

    expect(http.delete).toHaveBeenCalledWith("/contracts/7/payments/5");
  });
});
