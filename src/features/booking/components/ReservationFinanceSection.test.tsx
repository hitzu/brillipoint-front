// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReservationFinanceSection } from "./ReservationFinanceSection";

const payment = {
  id: 1,
  contractId: 1,
  amount: 700,
  method: "transfer",
  receivedAt: "2026-10-30",
  note: null,
  reference: null,
} as any;

const renderSection = (contract: Record<string, unknown>, balanceDue?: number) =>
  render(
    <ReservationFinanceSection
      contract={
        { total: 2000, subtotal: 2000, discountTotal: 0, ...contract } as any
      }
      payments={[payment]}
      paidAmount={700}
      balanceDue={balanceDue}
    />
  );

describe("ReservationFinanceSection", () => {
  it("shows the balance due on the event day with the included transport note", () => {
    renderSection({ transportStatus: "included" }, 1300);

    expect(screen.getByText("Saldo a pagar el día del evento")).toBeTruthy();
    expect(screen.getByText(/\$1,300/)).toBeTruthy();
    expect(
      screen.getByText("Traslado incluido sin costo adicional.")
    ).toBeTruthy();
  });

  it("flags the pending transport quote next to the balance", () => {
    renderSection({ transportStatus: "pending_quote" }, 1300);

    expect(screen.getByText(/\+ traslado por confirmar/)).toBeTruthy();
  });

  it("adds the quoted transport line and uses the server balance", () => {
    renderSection({ transportStatus: "quoted", transportAmount: 500 }, 1800);

    expect(screen.getByText("Traslado")).toBeTruthy();
    expect(screen.getByText(/\$1,800/)).toBeTruthy();
  });

  it("marks the contract as settled when nothing is left to pay", () => {
    renderSection({ transportStatus: "included" }, 0);

    expect(screen.getByText("✓ Pagado en su totalidad")).toBeTruthy();
  });

  it("keeps the payment history collapsed behind an accordion", () => {
    renderSection({ transportStatus: "included" }, 1300);

    expect(screen.getByText("Ver histórico de pagos")).toBeTruthy();
  });
});
