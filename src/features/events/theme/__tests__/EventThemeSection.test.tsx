// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../../../api/services/eventsService", () => ({
  getEventById: vi.fn(),
  updateEventById: vi.fn(),
}));

vi.mock("../../../../api/services/themeAssetsService", () => ({
  createThemeAssetUploadUrl: vi.fn(),
  uploadThemeAssetBlobToSignedUrl: vi.fn(),
}));

import { getEventById, updateEventById } from "../../../../api/services/eventsService";
import EventThemeSection from "../EventThemeSection";

const mockedGetEventById = getEventById as unknown as ReturnType<typeof vi.fn>;
const mockedUpdateEventById = updateEventById as unknown as ReturnType<typeof vi.fn>;

const FRESH_EVENT = {
  id: 7,
  themeOverrides: {
    tokens: { primary: "#111" },
    images: {
      logo: { path: "logo.png", url: "https://x/logo.png" },
      background: { path: "bg.png", url: "https://x/bg.png" },
    },
    decorations: {
      sparkles: { enabled: true },
      confetti: { enabled: true, shapes: ["star"] },
    },
    decorativeIcon: "flower",
  },
};

beforeEach(() => {
  mockedGetEventById.mockReset();
  mockedUpdateEventById.mockReset();
});

describe("EventThemeSection", () => {
  it("renders the current background, confetti selection and read-only blocks", () => {
    render(
      <EventThemeSection
        eventId={7}
        initialThemeOverrides={FRESH_EVENT.themeOverrides as any}
      />,
    );

    expect(screen.getByAltText("Fondo actual del evento")).toBeTruthy();
    expect((screen.getByLabelText(/Estrella/) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText(/Corazón/) as HTMLInputElement).checked).toBe(false);
    expect(screen.getByText("decorativeIcon")).toBeTruthy();
    expect(screen.getByText(/"flower"/)).toBeTruthy();
  });

  it("removing the background and saving sends images.background = null while keeping unrelated keys", async () => {
    mockedGetEventById.mockResolvedValueOnce(FRESH_EVENT);
    mockedUpdateEventById.mockResolvedValueOnce(undefined);

    render(
      <EventThemeSection
        eventId={7}
        initialThemeOverrides={FRESH_EVENT.themeOverrides as any}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Quitar fondo" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar tema" }));

    await waitFor(() => expect(mockedUpdateEventById).toHaveBeenCalled());

    const [id, payload] = mockedUpdateEventById.mock.calls[0];
    expect(id).toBe(7);
    expect(payload.themeOverrides.images.background).toBeNull();
    expect(payload.themeOverrides.images.logo).toEqual(FRESH_EVENT.themeOverrides.images.logo);
    expect(payload.themeOverrides.decorativeIcon).toBe("flower");
    expect(payload.themeOverrides.decorations.sparkles).toEqual({ enabled: true });

    await screen.findByText("Tema actualizado exitosamente");
  });

  it("saving only a background change leaves inherited confetti untouched", async () => {
    const noConfetti = {
      id: 7,
      themeOverrides: {
        images: { background: { path: "bg.png", url: "https://x/bg.png" } },
      },
    };
    mockedGetEventById.mockResolvedValueOnce(noConfetti);
    mockedUpdateEventById.mockResolvedValueOnce(undefined);

    render(
      <EventThemeSection
        eventId={7}
        initialThemeOverrides={noConfetti.themeOverrides as any}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Quitar fondo" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar tema" }));

    await waitFor(() => expect(mockedUpdateEventById).toHaveBeenCalled());

    const [, payload] = mockedUpdateEventById.mock.calls[0];
    expect(payload.themeOverrides.decorations).toBeUndefined();
  });

  it("toggling a confetti shape and saving sends the updated shapes list", async () => {
    mockedGetEventById.mockResolvedValueOnce(FRESH_EVENT);
    mockedUpdateEventById.mockResolvedValueOnce(undefined);

    render(
      <EventThemeSection
        eventId={7}
        initialThemeOverrides={FRESH_EVENT.themeOverrides as any}
      />,
    );

    fireEvent.click(screen.getByLabelText(/Corazón/));
    fireEvent.click(screen.getByRole("button", { name: "Guardar tema" }));

    await waitFor(() => expect(mockedUpdateEventById).toHaveBeenCalled());

    const [, payload] = mockedUpdateEventById.mock.calls[0];
    expect(payload.themeOverrides.decorations.confetti.shapes.sort()).toEqual(
      ["heart", "star"].sort(),
    );
    expect(payload.themeOverrides.decorations.confetti.enabled).toBe(true);
  });

  it("shows an error toast when the save fails", async () => {
    mockedGetEventById.mockRejectedValueOnce({
      response: { data: { message: "No se pudo actualizar" } },
    });

    render(
      <EventThemeSection
        eventId={7}
        initialThemeOverrides={FRESH_EVENT.themeOverrides as any}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Guardar tema" }));

    await screen.findByText("No se pudo actualizar");
    expect(mockedUpdateEventById).not.toHaveBeenCalled();
  });
});
