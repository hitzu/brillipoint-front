// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { getEventById, updateEventById } from "../../../../api/services/eventsService";
import { getEventTheme } from "../../../../api/services/partyPublicService";
import EventThemeSection from "../EventThemeSection";

const mockedGetEventById = getEventById as unknown as ReturnType<typeof vi.fn>;
const mockedUpdateEventById = updateEventById as unknown as ReturnType<typeof vi.fn>;
const mockedGetEventTheme = getEventTheme as unknown as ReturnType<typeof vi.fn>;

const BRANDED = {
  tokens: { primary: "#111111" },
  images: { background: { path: "bg.png", url: "https://x/bg.png" } },
  decorativeIcon: "flower",
};

const toggle = () => screen.getByRole("button", { name: /Marca del evento/ });

beforeEach(() => {
  mockedGetEventById.mockReset();
  mockedUpdateEventById.mockReset();
  mockedGetEventTheme.mockReset();
  mockedGetEventTheme.mockResolvedValue({ eventTheme: null });
});

describe("EventThemeSection brand collapse", () => {
  it("is expanded on load when the event already has brand content", () => {
    render(<EventThemeSection eventId={7} initialThemeOverrides={BRANDED as any} />);

    expect(toggle().getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText(/Para empresas o eventos con marca propia/)).toBeTruthy();
  });

  it.each([[null], [{}], [{ tokens: {} }]])(
    "is collapsed on load for a non-branded event (%j)",
    (initial) => {
      render(<EventThemeSection eventId={7} initialThemeOverrides={initial as any} />);

      expect(toggle().getAttribute("aria-expanded")).toBe("false");
      const panel = document.getElementById(toggle().getAttribute("aria-controls") as string);
      expect(panel?.classList.contains("show")).toBe(false);
    },
  );

  it("toggling opens and closes the section", async () => {
    render(<EventThemeSection eventId={7} initialThemeOverrides={null} />);

    fireEvent.click(toggle());
    await waitFor(() => expect(toggle().getAttribute("aria-expanded")).toBe("true"));
    fireEvent.click(toggle());
    await waitFor(() => expect(toggle().getAttribute("aria-expanded")).toBe("false"));
  });

  it("collapsing never changes what gets saved", async () => {
    mockedGetEventById.mockResolvedValueOnce({ id: 7, themeOverrides: BRANDED });
    mockedUpdateEventById.mockResolvedValueOnce(undefined);
    render(<EventThemeSection eventId={7} initialThemeOverrides={BRANDED as any} />);

    fireEvent.click(toggle());
    await waitFor(() => expect(toggle().getAttribute("aria-expanded")).toBe("false"));
    fireEvent.click(toggle());
    await waitFor(() => expect(toggle().getAttribute("aria-expanded")).toBe("true"));

    fireEvent.click(screen.getByRole("button", { name: "Guardar tema" }));
    await waitFor(() => expect(mockedUpdateEventById).toHaveBeenCalled());

    expect(mockedUpdateEventById.mock.calls[0][1].themeOverrides).toEqual(BRANDED);
  });

  it("labels the splash block as the logo and its background", () => {
    render(<EventThemeSection eventId={7} initialThemeOverrides={BRANDED as any} />);

    expect(screen.getByRole("heading", { name: /Logo y fondo del logo/ })).toBeTruthy();
  });
});
