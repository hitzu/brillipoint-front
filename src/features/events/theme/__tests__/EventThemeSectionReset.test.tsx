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

vi.mock("../../../../api/services/partyPublicService", () => ({
  getEventTheme: vi.fn(),
}));

import { updateEventById } from "../../../../api/services/eventsService";
import { getEventTheme } from "../../../../api/services/partyPublicService";
import EventThemeSection from "../EventThemeSection";

const mockedUpdateEventById = updateEventById as unknown as ReturnType<typeof vi.fn>;
const mockedGetEventTheme = getEventTheme as unknown as ReturnType<typeof vi.fn>;

const OVERRIDES = {
  tokens: { primary: "#000000", accent: "#bb0a30" },
  images: { background: { path: "bg.png", url: "https://x/bg.png" } },
  decorations: { confetti: { enabled: true, shapes: ["star"] } },
};

beforeEach(() => {
  mockedUpdateEventById.mockReset();
  mockedGetEventTheme.mockReset();
  mockedGetEventTheme.mockResolvedValue({ eventTheme: null });
});

describe("EventThemeSection reset to base theme", () => {
  it("is disabled when the event has no overrides", () => {
    render(<EventThemeSection eventId={7} initialThemeOverrides={null} />);

    const button = screen.getByRole("button", { name: "Restablecer al tema base" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("does not PATCH when staff cancels the confirmation", () => {
    render(<EventThemeSection eventId={7} initialThemeOverrides={OVERRIDES as any} />);

    fireEvent.click(screen.getByRole("button", { name: "Restablecer al tema base" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(mockedUpdateEventById).not.toHaveBeenCalled();
  });

  it("sends themeOverrides = null after confirming and clears the editor", async () => {
    mockedUpdateEventById.mockResolvedValueOnce(undefined);

    render(<EventThemeSection eventId={7} initialThemeOverrides={OVERRIDES as any} />);

    expect(screen.getByAltText("Fondo actual del evento")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Restablecer al tema base" }));
    fireEvent.click(screen.getByRole("button", { name: "Sí, restablecer" }));

    await waitFor(() => expect(mockedUpdateEventById).toHaveBeenCalledTimes(1));
    expect(mockedUpdateEventById).toHaveBeenCalledWith(7, { themeOverrides: null });

    await waitFor(() => expect(screen.queryByAltText("Fondo actual del evento")).toBeNull());
    expect((screen.getByLabelText(/Estrella/) as HTMLInputElement).checked).toBe(false);
    expect(
      (screen.getByRole("button", { name: "Restablecer al tema base" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
