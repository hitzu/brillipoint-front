// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReservationPreviewNotice } from "./ReservationPreviewNotice";

describe("ReservationPreviewNotice", () => {
  afterEach(() => vi.useRealTimers());

  it("shows the quotation terms through the fifth calendar day after creation", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 6, 23, 59));
    render(
      <ReservationPreviewNotice
        paidAmount={0}
        createdAt="2026-11-01T12:00:00"
      />
    );

    const notice = screen.getByRole("status");
    expect(notice.textContent).toContain(
      "Cotización válida hasta el 6 de noviembre de 2026."
    );
    expect(notice.textContent).toContain(
      "Los precios, descuentos, beneficios y obsequios incluidos en esta propuesta serán válidos únicamente durante el periodo de vigencia indicado."
    );
    expect(notice.textContent).toContain(
      "Esta cotización está sujeta a disponibilidad y no garantiza la reserva de tu fecha. Tu reservación quedará confirmada una vez que recibamos y registremos el pago de tu apartado."
    );
    expect(notice.textContent).toContain(
      "Una vez finalizada la vigencia, los precios y beneficios estarán sujetos a actualización."
    );
  });

  it("shows the expiration message after the fifth calendar day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 7, 0, 0));
    render(
      <ReservationPreviewNotice
        paidAmount={0}
        createdAt="2026-11-01T12:00:00"
      />
    );

    expect(screen.getByRole("status").textContent).toContain(
      "Esta cotizacion ha finalizado, por favor solicita otra con el equipo de brillipoint"
    );
    expect(screen.queryByText(/Cotización válida hasta/)).toBeNull();
  });

  it("renders nothing once there is a payment", () => {
    const { container } = render(
      <ReservationPreviewNotice
        paidAmount={500}
        createdAt="2026-11-01T12:00:00"
      />
    );
    expect(container.innerHTML).toBe("");
  });
});
