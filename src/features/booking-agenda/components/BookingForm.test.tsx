// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BookingForm } from "./BookingForm";

const save = vi.fn().mockResolvedValue(undefined);
describe("BookingForm", () => {
  it("prefills fields and rejects unsafe Maps URLs", async () => {
    render(
      <BookingForm
        initialDate="2026-09-19"
        booking={{
          id: 4,
          status: "confirmed",
          eventDate: "2026-09-19",
          serviceStartsAt: "2026-09-19T18:00:00.000Z",
          serviceEndsAt: "2026-09-20T02:00:00.000Z",
          title: "Fiesta",
          purpose: "event",
          venueName: "Foro",
          mapsUrl: "https://maps.example",
        }}
        onCancel={() => undefined}
        onSave={save}
      />
    );
    expect((screen.getByLabelText("Título") as HTMLInputElement).value).toBe(
      "Fiesta"
    );
    fireEvent.change(screen.getByLabelText("Maps URL"), {
      target: { value: "https://" },
    });
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Guardar" })
        .closest("form") as HTMLFormElement
    );
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
  });

  it("renders API instants in Mexico City civil time and preserves an overnight interval", async () => {
    save.mockClear();
    render(
      <BookingForm
        initialDate="2026-09-19"
        booking={{
          id: 8,
          status: "confirmed",
          eventDate: "2026-09-19",
          serviceStartsAt: "2026-09-19T06:00:00.000Z",
          serviceEndsAt: "2026-09-20T08:00:00.000Z",
          title: null,
          purpose: "event",
          venueName: null,
          mapsUrl: " https://maps.example/ok ",
        }}
        onCancel={() => undefined}
        onSave={save}
      />
    );
    expect((screen.getByLabelText("Inicio") as HTMLInputElement).value).toBe(
      "00:00"
    );
    expect((screen.getByLabelText("Fin") as HTMLInputElement).value).toBe(
      "02:00"
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0][0]).toMatchObject({
      serviceStartsAt: "2026-09-19T06:00:00.000Z",
      serviceEndsAt: "2026-09-20T08:00:00.000Z",
      mapsUrl: "https://maps.example/ok",
    });
  });
});

it("applies the overnight preset as one Mexico City interval crossing midnight", async () => {
  save.mockClear();
  render(
    <BookingForm
      initialDate="2026-09-19"
      onCancel={() => undefined}
      onSave={save}
    />
  );

  expect((screen.getByLabelText("Inicio") as HTMLInputElement).type).toBe(
    "time"
  );
  expect((screen.getByLabelText("Fin") as HTMLInputElement).type).toBe("time");
  fireEvent.click(screen.getByRole("button", { name: "Noche (20:00–04:00)" }));
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  expect(save.mock.calls[0][0]).toMatchObject({
    eventDate: "2026-09-19",
    serviceStartsAt: "2026-09-20T02:00:00.000Z",
    serviceEndsAt: "2026-09-20T10:00:00.000Z",
  });
});

it("renders presets with a title and compact range subtitle", () => {
  render(
    <BookingForm
      initialDate="2026-09-19"
      onCancel={() => undefined}
      onSave={save}
    />
  );

  expect(screen.getByText("Mañana").tagName).toBe("STRONG");
  expect(screen.getByText("(04:00–12:00)").tagName).toBe("SMALL");
  expect(
    screen.queryByRole("button", { name: "Todo el día (00:00–00:00)" })
  ).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Mañana (04:00–12:00)" }));
  expect((screen.getByLabelText("Inicio") as HTMLInputElement).value).toBe(
    "04:00"
  );
  expect((screen.getByLabelText("Fin") as HTMLInputElement).value).toBe(
    "12:00"
  );

  fireEvent.click(screen.getByRole("button", { name: "Tarde (12:00–20:00)" }));
  expect((screen.getByLabelText("Inicio") as HTMLInputElement).value).toBe(
    "12:00"
  );
  expect((screen.getByLabelText("Fin") as HTMLInputElement).value).toBe(
    "20:00"
  );
  expect(
    screen.getByRole("button", { name: "Noche (20:00–04:00)" })
  ).toBeTruthy();
});

it("keeps the dialog open while a save is in progress", async () => {
  let resolveSave: (() => void) | undefined;
  const pendingSave = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        resolveSave = resolve;
      })
  );
  render(
    <BookingForm
      initialDate="2026-09-19"
      onCancel={() => undefined}
      onSave={pendingSave}
    />
  );
  fireEvent.change(screen.getByLabelText("Fin"), {
    target: { value: "13:00" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await waitFor(() => expect(pendingSave).toHaveBeenCalledTimes(1));
  expect(
    (screen.getByRole("button", { name: "Cancelar" }) as HTMLButtonElement)
      .disabled
  ).toBe(true);
  resolveSave?.();
  await waitFor(() =>
    expect(
      (screen.getByRole("button", { name: "Cancelar" }) as HTMLButtonElement)
        .disabled
    ).toBe(false)
  );
});

it("preserves the edited draft when only the booking status changes", () => {
  const booking = {
    id: 11,
    status: "hold" as const,
    eventDate: "2026-09-19",
    serviceStartsAt: "2026-09-19T18:00:00.000Z",
    serviceEndsAt: "2026-09-19T20:00:00.000Z",
    title: "Antes",
    purpose: "event",
    venueName: null,
    mapsUrl: null,
  };
  const view = render(
    <BookingForm
      initialDate="2026-09-19"
      booking={booking}
      onCancel={() => undefined}
      onSave={save}
    />
  );
  fireEvent.change(screen.getByLabelText("Título"), {
    target: { value: "Borrador" },
  });
  fireEvent.change(screen.getByLabelText("Nota interna"), {
    target: { value: "No perder" },
  });
  view.rerender(
    <BookingForm
      initialDate="2026-09-19"
      booking={{ ...booking, status: "confirmed" }}
      onCancel={() => undefined}
      onSave={save}
    />
  );
  expect((screen.getByLabelText("Título") as HTMLInputElement).value).toBe(
    "Borrador"
  );
  expect(
    (screen.getByLabelText("Nota interna") as HTMLTextAreaElement).value
  ).toBe("No perder");
});
