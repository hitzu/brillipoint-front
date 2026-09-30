// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/router", () => ({
  useRouter: () => ({ push }),
}));
vi.mock("@layout/index", () => ({ default: ({ children }: any) => children }));
vi.mock("@common/BreadcrumbItem", () => ({ default: () => null }));
vi.mock("../api/services/eventsService", () => ({ createEvent: vi.fn() }));
vi.mock("../api/services/contractService", () => ({ getContracts: vi.fn() }));
vi.mock("../api/services/eventTypesService", () => ({ getEventTypes: vi.fn() }));
vi.mock("../api/services/eventThemesService", () => ({ getEventThemes: vi.fn() }));

import { createEvent } from "../api/services/eventsService";
import { getContracts } from "../api/services/contractService";
import { getEventTypes } from "../api/services/eventTypesService";
import { getEventThemes } from "../api/services/eventThemesService";
import EventAdd from "./event-add";

const mockedCreateEvent = vi.mocked(createEvent);

const changeField = (name: string, value: string) => {
  const field = document.querySelector(`[name="${name}"]`);
  if (!field) throw new Error(`Missing form field: ${name}`);
  fireEvent.change(field, { target: { value } });
};

beforeEach(() => {
  push.mockReset();
  mockedCreateEvent.mockReset();
  vi.mocked(getContracts).mockResolvedValue([
    { id: 12, sku: "C-12", clientName: "Client" },
  ] as any);
  vi.mocked(getEventTypes).mockResolvedValue([
    { id: 3, name: "Wedding" },
  ] as any);
  vi.mocked(getEventThemes).mockResolvedValue([] as any);
});

describe("EventAdd", () => {
  it("navigates to the created event edit page", async () => {
    mockedCreateEvent.mockResolvedValue({ id: 42 } as any);
    render(<EventAdd />);

    await screen.findByRole("option", { name: /C-12/ });
    changeField("contractId", "12");
    changeField("eventType", "3");
    changeField("key", "event-key");
    changeField("honoreesNames", "Alex y Sam");
    fireEvent.click(screen.getByRole("button", { name: "Crear evento" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/event-edit/42"));
  });

  it("keeps the user on the form when event creation fails", async () => {
    mockedCreateEvent.mockRejectedValue({
      response: { data: { message: "Creation failed" } },
    });
    render(<EventAdd />);

    await screen.findByRole("option", { name: /C-12/ });
    changeField("contractId", "12");
    changeField("eventType", "3");
    changeField("key", "event-key");
    changeField("honoreesNames", "Alex y Sam");
    fireEvent.click(screen.getByRole("button", { name: "Crear evento" }));

    await screen.findByText("Creation failed");
    expect(push).not.toHaveBeenCalled();
  });
});
