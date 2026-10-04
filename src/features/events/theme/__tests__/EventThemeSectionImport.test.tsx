// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

const STORED = {
  tokens: { primary: "#111111" },
  images: {
    logo: { path: "logo.png", url: "https://x/logo.png" },
    background: { path: "bg.png", url: "https://x/bg.png" },
    splashIcon: { path: "s.png", url: "https://x/s.png" },
  },
  decorations: {
    sparkles: { enabled: true },
    confetti: { enabled: true, shapes: ["star"] },
  },
  decorativeIcon: "flower",
};

const IMPORTED = {
  tokens: { primary: "#222222", fontHeading: "Playfair Display" },
  images: {
    background: { path: "other.png", url: "https://x/other.png" },
    splashIcon: { path: "o.png", url: "https://x/o.png", plate: "#000000" },
  },
  decorations: { confetti: { enabled: true, shapes: ["heart"], colors: ["#ffffff"] } },
  socialCta: {
    headline: { text: { es: "Síguenos" } },
    subtitle: { key: "party.socialCta.subtitle" },
    socials: { instagram: "https://instagram.com/acme" },
  },
  rewardPromo: { handle: "@acme" },
};

const importJson = (value: string) => {
  fireEvent.change(screen.getByLabelText("Importar JSON (themeOverrides)"), {
    target: { value },
  });
  fireEvent.click(screen.getByRole("button", { name: "Aplicar JSON" }));
};

const renderSection = () =>
  render(<EventThemeSection eventId={7} token="tok" initialThemeOverrides={STORED as any} />);

beforeEach(() => {
  mockedGetEventById.mockReset();
  mockedUpdateEventById.mockReset();
  mockedGetEventTheme.mockReset();
  mockedGetEventTheme.mockResolvedValue({ eventTheme: null });
  (URL as any).createObjectURL = vi.fn(() => "blob:preview");
  (URL as any).revokeObjectURL = vi.fn();
});

describe("EventThemeSection JSON import", () => {
  it("loads a valid import into the editor without saving and keeps the current images", async () => {
    renderSection();

    importJson(JSON.stringify(IMPORTED));

    expect((screen.getByLabelText(/Corazón/) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText(/Estrella/) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByLabelText("Color del círculo") as HTMLInputElement).value).toBe("#000000");
    const preview = screen.getByRole("region", { name: "Vista previa de redes sociales y CTA" });
    expect(within(preview).getByText("Síguenos")).toBeTruthy();
    expect(screen.getByText("rewardPromo")).toBeTruthy();
    expect(screen.getByText("Colores y tipografías")).toBeTruthy();
    expect(
      screen.getAllByText(/Playfair Display/).some((el) => el.tagName !== "TEXTAREA"),
    ).toBe(true);
    expect(screen.getByAltText("Fondo actual del evento").getAttribute("src")).toBe(
      "https://x/bg.png",
    );
    expect(screen.getByAltText("Logo actual del evento").getAttribute("src")).toBe(
      "https://x/s.png",
    );
    expect(screen.getByText(/JSON aplicado/)).toBeTruthy();
    // Let the resolved theme settle; it must not overwrite the imported socialCta.
    await waitFor(() => expect(mockedGetEventTheme).toHaveBeenCalled());
    expect(within(preview).getByText("Síguenos")).toBeTruthy();
    expect(mockedUpdateEventById).not.toHaveBeenCalled();
  });

  it("shows an inline error for invalid JSON and changes nothing", () => {
    renderSection();

    importJson("{ tokens: ");

    expect(screen.getByRole("alert").textContent).toMatch(/JSON no es válido/);
    expect((screen.getByLabelText(/Estrella/) as HTMLInputElement).checked).toBe(true);
    expect(screen.queryByText("rewardPromo")).toBeNull();
    expect(mockedUpdateEventById).not.toHaveBeenCalled();
  });

  it("rejects a JSON array", () => {
    renderSection();

    importJson("[]");

    expect(screen.getByRole("alert").textContent).toMatch(/objeto/);
  });

  it("'Guardar tema' persists the imported blocks over the refetched ones, keeping stored images", async () => {
    mockedGetEventById.mockResolvedValueOnce({ id: 7, themeOverrides: STORED });
    mockedUpdateEventById.mockResolvedValueOnce(undefined);
    renderSection();

    importJson(JSON.stringify(IMPORTED));
    fireEvent.click(screen.getByRole("button", { name: "Guardar tema" }));
    await waitFor(() => expect(mockedUpdateEventById).toHaveBeenCalled());

    const payload = mockedUpdateEventById.mock.calls[0][1].themeOverrides;
    expect(payload.tokens).toEqual(IMPORTED.tokens);
    expect(payload.decorations).toEqual(IMPORTED.decorations);
    expect(payload.socialCta).toEqual(IMPORTED.socialCta);
    expect(payload.rewardPromo).toEqual(IMPORTED.rewardPromo);
    expect(payload.decorativeIcon).toBe("flower");
    expect(payload.images).toEqual({
      logo: STORED.images.logo,
      background: STORED.images.background,
      splashIcon: { ...STORED.images.splashIcon, plate: "#000000" },
    });
    await screen.findByText("Tema actualizado exitosamente");
  });

  it("edits made after the import still win on save", async () => {
    mockedGetEventById.mockResolvedValueOnce({ id: 7, themeOverrides: STORED });
    mockedUpdateEventById.mockResolvedValueOnce(undefined);
    renderSection();

    importJson(JSON.stringify(IMPORTED));
    fireEvent.click(screen.getByLabelText(/Estrella/));
    fireEvent.click(screen.getByRole("button", { name: "Guardar tema" }));
    await waitFor(() => expect(mockedUpdateEventById).toHaveBeenCalled());

    const payload = mockedUpdateEventById.mock.calls[0][1].themeOverrides;
    expect(payload.decorations.confetti).toEqual({
      enabled: true,
      shapes: ["heart", "star"],
      colors: ["#ffffff"],
    });
  });
});
