// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../../api/services/paymentService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../../api/services/paymentService")>()),
  uploadPaymentReceipt: vi.fn(),
}));

import { uploadPaymentReceipt } from "../../../../../api/services/paymentService";
import { PaymentForm } from "../PaymentForm";

const mockedUpload = vi.mocked(uploadPaymentReceipt);

const setField = (name: string, value: string) =>
  fireEvent.change(document.querySelector(`[name="${name}"]`)!, {
    target: { value },
  });

const fileInput = () =>
  document.querySelector('input[name="receipt"]') as HTMLInputElement | null;

beforeEach(() => mockedUpload.mockReset());

describe("PaymentForm", () => {
  it("hides the receipt upload for cash", () => {
    render(<PaymentForm contractId={7} onSubmit={vi.fn()} />);

    expect(fileInput()).toBeNull();
  });

  it("registers a transfer with neither reference nor receipt", async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<PaymentForm contractId={7} onSubmit={onSubmit} />);
    setField("amount", "500");
    setField("method", "transfer");

    fireEvent.click(screen.getByText("Registrar pago"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload).toMatchObject({ amount: 500, method: "transfer" });
    expect(payload.receiptPath).toBeUndefined();
    expect(payload.reference).toBeUndefined();
  });

  it("uploads the PDF and sends its path with the payment", async () => {
    mockedUpload.mockResolvedValueOnce("payments/7/u_a.pdf");
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<PaymentForm contractId={7} onSubmit={onSubmit} />);
    setField("amount", "500");
    setField("method", "card");
    const pdf = new File(["x"], "a.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput()!, { target: { files: [pdf] } });

    fireEvent.click(screen.getByText("Registrar pago"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(mockedUpload).toHaveBeenCalledWith(7, pdf);
    expect(onSubmit.mock.calls[0][0].receiptPath).toBe("payments/7/u_a.pdf");
  });

  it("rejects a non-PDF file on the client", async () => {
    render(<PaymentForm contractId={7} onSubmit={vi.fn()} />);
    setField("method", "transfer");
    const png = new File(["x"], "a.png", { type: "image/png" });

    fireEvent.change(fileInput()!, { target: { files: [png] } });

    await waitFor(() =>
      expect(screen.getByText(/debe ser un archivo PDF/)).toBeTruthy()
    );
  });

  it("edits a payment: prefilled, sends null to remove its receipt", async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(
      <PaymentForm
        contractId={7}
        onSubmit={onSubmit}
        payment={{
          id: 5,
          contractId: 7,
          amount: 200,
          method: "transfer",
          receivedAt: "2030-01-01T10:00:00.000Z",
          note: null,
          reference: "folio",
          receiptUrl: "https://s/r.pdf",
        }}
      />
    );
    expect((document.querySelector('[name="amount"]') as HTMLInputElement).value).toBe("200");

    fireEvent.click(screen.getByText("Quitar comprobante"));
    fireEvent.click(screen.getByText("Guardar cambios"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      amount: 200,
      reference: "folio",
      receiptPath: null,
    });
  });
});
