// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { AgendaEntryContent } from "./AgendaEntryCard";

it("renders calendar entries with only their title and hours", () => {
  render(
    <AgendaEntryContent
      date="2026-09-20"
      entry={{
        key: "agenda:overnight",
        id: 1,
        bookingId: 1,
        contractId: null,
        sku: null,
        title: "Evento nocturno",
        clientName: null,
        venueName: "Foro Azul",
        date: "2026-09-19",
        continuesFromPreviousDay: true,
        continuesNextDay: false,
        startsAt: "2026-09-20T02:00:00.000Z",
        endsAt: "2026-09-20T10:00:00.000Z",
        blocks: [],
        isApproximate: false,
      }}
    />
  );

  expect(screen.getByText("Evento nocturno")).toBeTruthy();
  expect(screen.getByText("00:00 – 04:00")).toBeTruthy();
  expect(screen.queryByText("Foro Azul")).toBeNull();
  expect(screen.queryByText("Continúa del día anterior")).toBeNull();
  expect(screen.queryByText("Continúa al día siguiente")).toBeNull();
});
