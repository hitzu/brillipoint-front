// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PaymentSection } from "../PaymentSection";

describe("PaymentSection", () => {
  it("shows subtotal and balance, and reports deposit and method changes", () => {
    const onDepositAmountChange = vi.fn();
    const onPaymentMethodChange = vi.fn();
    render(
      <PaymentSection
        subtotal={5000}
        depositAmount="1000"
        onDepositAmountChange={onDepositAmountChange}
        balance={4000}
        paymentMethod="cash"
        onPaymentMethodChange={onPaymentMethodChange}
      />,
    );
    expect(screen.getByText(/5,?000/)).toBeTruthy();
    expect(screen.getByText(/4,?000/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Anticipo"), {
      target: { value: "1500" },
    });
    expect(onDepositAmountChange).toHaveBeenCalledWith("1500");

    fireEvent.change(screen.getByLabelText("Forma de pago"), {
      target: { value: "transfer" },
    });
    expect(onPaymentMethodChange).toHaveBeenCalledWith("transfer");
  });
});
