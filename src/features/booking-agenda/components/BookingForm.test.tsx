// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
import { BookingForm } from "./BookingForm";

const make409 = (data?: unknown) =>
  new AxiosError(
    "Request failed with status code 409",
    "ERR_BAD_REQUEST",
    undefined,
    undefined,
    {
      status: 409,
      statusText: "Conflict",
      headers: {},
      config: {} as never,
      data,
    } as never
  );

const make500 = () =>
  new AxiosError(
    "Request failed with status code 500",
    "ERR_BAD_RESPONSE",
    undefined,
    undefined,
    {
      status: 500,
      statusText: "Internal Server Error",
      headers: {},
      config: {} as never,
      data: undefined,
    } as never
  );

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

  // Inicio/Fin are now a Google-Calendar-style TimeSelect combobox (a text
  // input backed by a dropdown of options), not a native <input type="time">.
  expect(screen.getByLabelText("Inicio").getAttribute("role")).toBe(
    "combobox"
  );
  expect(screen.getByLabelText("Fin").getAttribute("role")).toBe("combobox");
  fireEvent.click(screen.getByRole("button", { name: "Noche (20:00–04:00)" }));
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  expect(save.mock.calls[0][0]).toMatchObject({
    eventDate: "2026-09-19",
    serviceStartsAt: "2026-09-20T02:00:00.000Z",
    serviceEndsAt: "2026-09-20T10:00:00.000Z",
  });
});

it("applies the all-day preset without advancing the selected civil day", async () => {
  save.mockClear();
  render(
    <BookingForm
      initialDate="2026-09-19"
      onCancel={() => undefined}
      onSave={save}
    />
  );

  fireEvent.click(
    screen.getByRole("button", { name: "Todo el día (00:00–23:59)" })
  );
  expect((screen.getByLabelText("Inicio") as HTMLInputElement).value).toBe(
    "00:00"
  );
  expect((screen.getByLabelText("Fin") as HTMLInputElement).value).toBe(
    "23:59"
  );
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  expect(save.mock.calls[0][0]).toMatchObject({
    eventDate: "2026-09-19",
    serviceStartsAt: "2026-09-19T06:00:00.000Z",
    serviceEndsAt: "2026-09-20T05:59:00.000Z",
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

it("shows the conflicting booking instead of the raw HTTP status on a 409", async () => {
  save.mockClear();
  save.mockRejectedValueOnce(
    make409({
      conflict: {
        id: 3,
        title: "Fiesta previa",
        serviceStartsAt: "2026-09-19T18:00:00.000Z",
        serviceEndsAt: "2026-09-20T02:00:00.000Z",
      },
    })
  );
  render(
    <BookingForm
      initialDate="2026-09-19"
      onCancel={() => undefined}
      onSave={save}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain("Fiesta previa");
  expect(alert.textContent).not.toContain("status code");
});

it("keeps the generic message for a non-409 failure", async () => {
  save.mockClear();
  save.mockRejectedValueOnce(make500());
  render(
    <BookingForm
      initialDate="2026-09-19"
      onCancel={() => undefined}
      onSave={save}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  const alert = await screen.findByRole("alert");
  expect(alert.textContent).toContain("Request failed with status code 500");
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

it("prefills date and exact times from a calendar-supplied draft on a new booking", async () => {
  save.mockClear();
  render(
    <BookingForm
      initialDate="2026-09-19"
      draft={{ date: "2026-09-21", startsAt: "14:00", endsAt: "20:00" }}
      onCancel={() => undefined}
      onSave={save}
    />
  );

  expect((screen.getByLabelText("Fecha") as HTMLInputElement).value).toBe(
    "2026-09-21"
  );
  expect((screen.getByLabelText("Inicio") as HTMLInputElement).value).toBe(
    "14:00"
  );
  expect((screen.getByLabelText("Fin") as HTMLInputElement).value).toBe(
    "20:00"
  );

  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  expect(save.mock.calls[0][0]).toMatchObject({
    eventDate: "2026-09-21",
    serviceStartsAt: "2026-09-21T20:00:00.000Z",
    serviceEndsAt: "2026-09-22T02:00:00.000Z",
  });
});

it("shows the end options with duration labels relative to the start", () => {
  render(
    <BookingForm
      initialDate="2026-09-19"
      onCancel={() => undefined}
      onSave={save}
    />
  );
  fireEvent.change(screen.getByLabelText("Inicio"), {
    target: { value: "19:00" },
  });
  fireEvent.focus(screen.getByLabelText("Fin"));
  expect(screen.getByRole("option", { name: "20:00 (1 h)" })).toBeTruthy();
  expect(screen.getByRole("option", { name: "19:30 (30 min)" })).toBeTruthy();
});

it("shows a next-day warning icon whose tooltip gives the wrapped duration", async () => {
  render(
    <BookingForm
      initialDate="2026-09-19"
      onCancel={() => undefined}
      onSave={save}
    />
  );
  fireEvent.change(screen.getByLabelText("Inicio"), {
    target: { value: "20:00" },
  });
  fireEvent.change(screen.getByLabelText("Fin"), {
    target: { value: "04:00" },
  });
  const warning = screen.getByRole("img", {
    name: "Termina el día siguiente (8 h)",
  });
  // An icon, not inline text: inline text grew the modal when it appeared.
  expect(screen.queryByText("Termina el día siguiente (8 h)")).toBeNull();
  fireEvent.mouseOver(warning);
  expect(await screen.findByRole("tooltip")).toHaveProperty(
    "textContent",
    "Termina el día siguiente (8 h)"
  );
});

it("does not show the next-day notice when end is after start", () => {
  render(
    <BookingForm
      initialDate="2026-09-19"
      onCancel={() => undefined}
      onSave={save}
    />
  );
  expect(
    screen.queryByRole("img", { name: /Termina el día siguiente/ })
  ).toBeNull();
});

it("keeps an off-grid preset value (23:59) displayed and editable", () => {
  render(
    <BookingForm
      initialDate="2026-09-19"
      onCancel={() => undefined}
      onSave={save}
    />
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Todo el día (00:00–23:59)" })
  );
  expect((screen.getByLabelText("Fin") as HTMLInputElement).value).toBe(
    "23:59"
  );
  fireEvent.change(screen.getByLabelText("Fin"), {
    target: { value: "22:15" },
  });
  expect((screen.getByLabelText("Fin") as HTMLInputElement).value).toBe(
    "22:15"
  );
});

it("prefills an overnight draft (endsAt at or before startsAt) as the next civil day", async () => {
  save.mockClear();
  render(
    <BookingForm
      initialDate="2026-09-19"
      draft={{ date: "2026-09-21", startsAt: "20:00", endsAt: "04:00" }}
      onCancel={() => undefined}
      onSave={save}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  expect(save.mock.calls[0][0]).toMatchObject({
    eventDate: "2026-09-21",
    serviceStartsAt: "2026-09-22T02:00:00.000Z",
    serviceEndsAt: "2026-09-22T10:00:00.000Z",
  });
});
