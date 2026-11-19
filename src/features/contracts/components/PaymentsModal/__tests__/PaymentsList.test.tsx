// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PaymentsList } from "../PaymentsList";

const base = {
  contractId: 7,
  amount: 100,
  method: "transfer" as const,
  receivedAt: "2030-01-01T10:00:00.000Z",
  note: null,
  reference: null,
};

describe("PaymentsList", () => {
  it("shows 'Ver comprobante' only for payments with a receipt", () => {
    render(
      <PaymentsList
        loading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        payments={[
          { ...base, id: 1, receiptUrl: "https://s/r.pdf" },
          { ...base, id: 2, receiptUrl: null },
        ]}
      />
    );

    const links = screen.getAllByText("Ver comprobante");
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("target")).toBe("_blank");
    expect(screen.getAllByText("Editar")).toHaveLength(2);
  });

  it("calls onEdit and onDelete with the payment", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const payment = { ...base, id: 1 };
    render(
      <PaymentsList loading={false} payments={[payment]} onEdit={onEdit} onDelete={onDelete} />
    );

    fireEvent.click(screen.getByText("Editar"));
    fireEvent.click(screen.getByText("Eliminar"));

    expect(onEdit).toHaveBeenCalledWith(payment);
    expect(onDelete).toHaveBeenCalledWith(payment);
  });
});
