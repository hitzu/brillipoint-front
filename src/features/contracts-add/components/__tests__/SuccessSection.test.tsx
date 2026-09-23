// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SuccessSection } from "../SuccessSection";

describe("SuccessSection", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  it("shows the client name, the link as text and a QR code", () => {
    render(
      <SuccessSection
        clientName="Ana Ruiz"
        contractLink="https://app.test/reserva/tok-1?brandId=1"
        bookingWarning={null}
        onReset={vi.fn()}
        onGoToContracts={vi.fn()}
      />,
    );
    expect(screen.getByText(/contrato generado/i)).toBeTruthy();
    expect(screen.getByText(/Ana Ruiz/)).toBeTruthy();
    expect(
      screen.getByText("https://app.test/reserva/tok-1?brandId=1"),
    ).toBeTruthy();
    expect(document.querySelector("svg")).toBeTruthy();
  });

  it("shows the booking warning when present", () => {
    render(
      <SuccessSection
        clientName="Ana Ruiz"
        contractLink="https://app.test/reserva/tok-1?brandId=1"
        bookingWarning="El contrato se generó, pero no se pudo apartar la fecha en la agenda."
        onReset={vi.fn()}
        onGoToContracts={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain(
      "no se pudo apartar la fecha",
    );
  });

  it("copies the link to the clipboard and shows feedback", async () => {
    vi.useFakeTimers();
    render(
      <SuccessSection
        clientName="Ana Ruiz"
        contractLink="https://app.test/reserva/tok-1?brandId=1"
        bookingWarning={null}
        onReset={vi.fn()}
        onGoToContracts={vi.fn()}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /copiar link/i }));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "https://app.test/reserva/tok-1?brandId=1",
    );
    expect(screen.getByRole("button", { name: /copiado/i })).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(screen.getByRole("button", { name: /copiar link/i })).toBeTruthy();
    vi.useRealTimers();
  });

  it("calls onReset and onGoToContracts", () => {
    const onReset = vi.fn();
    const onGoToContracts = vi.fn();
    render(
      <SuccessSection
        clientName="Ana Ruiz"
        contractLink="https://app.test/reserva/tok-1?brandId=1"
        bookingWarning={null}
        onReset={onReset}
        onGoToContracts={onGoToContracts}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /nuevo contrato/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /ir a contratos/i }));
    expect(onGoToContracts).toHaveBeenCalledTimes(1);
  });
});
