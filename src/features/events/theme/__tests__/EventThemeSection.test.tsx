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
import {
  createThemeAssetUploadUrl,
  uploadThemeAssetBlobToSignedUrl,
} from "../../../../api/services/themeAssetsService";
import EventThemeSection from "../EventThemeSection";

const mockedGetEventById = getEventById as unknown as ReturnType<typeof vi.fn>;
const mockedUpdateEventById = updateEventById as unknown as ReturnType<typeof vi.fn>;

const mockedCreateUploadUrl = createThemeAssetUploadUrl as unknown as ReturnType<typeof vi.fn>;
const mockedUploadBlob = uploadThemeAssetBlobToSignedUrl as unknown as ReturnType<typeof vi.fn>;

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
  mockedCreateUploadUrl.mockReset();
  mockedUploadBlob.mockReset();
  (URL as any).createObjectURL = vi.fn(() => "blob:preview");
  (URL as any).revokeObjectURL = vi.fn();
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

  it("uploading a splash icon uses slot splashIcon and saves { path, url }", async () => {
    mockedCreateUploadUrl.mockResolvedValueOnce({
      signedUrl: "https://signed",
      path: "events/7/splash.svg",
      publicUrl: "https://x/splash.svg",
    });
    mockedUploadBlob.mockResolvedValueOnce(undefined);
    mockedGetEventById.mockResolvedValueOnce(FRESH_EVENT);
    mockedUpdateEventById.mockResolvedValueOnce(undefined);

    render(
      <EventThemeSection
        eventId={7}
        initialThemeOverrides={FRESH_EVENT.themeOverrides as any}
      />,
    );

    const file = new File(["<svg/>"], "splash.svg", { type: "image/svg+xml" });
    fireEvent.change(screen.getByLabelText("Archivo del logo de bienvenida"), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar tema" }));

    await waitFor(() => expect(mockedUpdateEventById).toHaveBeenCalled());

    expect(mockedCreateUploadUrl).toHaveBeenCalledTimes(1);
    expect(mockedCreateUploadUrl.mock.calls[0][0]).toMatchObject({
      ownerType: "event",
      ownerId: 7,
      slot: "splashIcon",
      mime: "image/svg+xml",
    });
    expect(mockedUploadBlob).toHaveBeenCalledTimes(1);

    const [, payload] = mockedUpdateEventById.mock.calls[0];
    expect(payload.themeOverrides.images.splashIcon).toEqual({
      path: "events/7/splash.svg",
      url: "https://x/splash.svg",
    });
    expect(payload.themeOverrides.images.background).toEqual(
      FRESH_EVENT.themeOverrides.images.background,
    );
    expect(payload.themeOverrides.decorativeIcon).toBe("flower");
  });

  it("removing the splash icon saves images.splashIcon = null", async () => {
    const withSplash = {
      id: 7,
      themeOverrides: {
        ...FRESH_EVENT.themeOverrides,
        images: {
          ...FRESH_EVENT.themeOverrides.images,
          splashIcon: { path: "s.png", url: "https://x/s.png" },
        },
      },
    };
    mockedGetEventById.mockResolvedValueOnce(withSplash);
    mockedUpdateEventById.mockResolvedValueOnce(undefined);

    render(
      <EventThemeSection eventId={7} initialThemeOverrides={withSplash.themeOverrides as any} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Quitar logo" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar tema" }));

    await waitFor(() => expect(mockedUpdateEventById).toHaveBeenCalled());

    const [, payload] = mockedUpdateEventById.mock.calls[0];
    expect(payload.themeOverrides.images.splashIcon).toBeNull();
    expect(payload.themeOverrides.images.background).toEqual(
      FRESH_EVENT.themeOverrides.images.background,
    );
    expect(mockedCreateUploadUrl).not.toHaveBeenCalled();
  });

  it("does not rewrite splashIcon when staff did not touch it", async () => {
    const withSplash = {
      id: 7,
      themeOverrides: {
        images: { splashIcon: { path: "s.png", url: "https://x/s.png" } },
      },
    };
    mockedGetEventById.mockResolvedValueOnce(withSplash);
    mockedUpdateEventById.mockResolvedValueOnce(undefined);

    render(
      <EventThemeSection eventId={7} initialThemeOverrides={withSplash.themeOverrides as any} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Guardar tema" }));

    await waitFor(() => expect(mockedUpdateEventById).toHaveBeenCalled());

    const [, payload] = mockedUpdateEventById.mock.calls[0];
    expect(payload.themeOverrides.images.splashIcon).toEqual(withSplash.themeOverrides.images.splashIcon);
  });

  describe("splash plate", () => {
    const withPlate = (plate?: string) => ({
      id: 7,
      themeOverrides: {
        images: { splashIcon: { path: "s.png", url: "https://x/s.png", ...(plate ? { plate } : {}) } },
        decorativeIcon: "flower",
      },
    });
    const setPlate = (value: string) =>
      fireEvent.change(screen.getByLabelText("Color del círculo"), { target: { value } });

    it("saves the plate with a new upload", async () => {
      mockedCreateUploadUrl.mockResolvedValueOnce({
        signedUrl: "https://signed",
        path: "events/7/n.jpg",
        publicUrl: "https://x/n.jpg",
      });
      mockedUploadBlob.mockResolvedValueOnce(undefined);
      mockedGetEventById.mockResolvedValueOnce(FRESH_EVENT);
      mockedUpdateEventById.mockResolvedValueOnce(undefined);
      render(<EventThemeSection eventId={7} initialThemeOverrides={FRESH_EVENT.themeOverrides as any} />);

      fireEvent.change(screen.getByLabelText("Archivo del logo de bienvenida"), {
        target: { files: [new File(["x"], "n.jpg", { type: "image/jpeg" })] },
      });
      setPlate("#000000");
      fireEvent.click(screen.getByRole("button", { name: "Guardar tema" }));
      await waitFor(() => expect(mockedUpdateEventById).toHaveBeenCalled());

      const [, payload] = mockedUpdateEventById.mock.calls[0];
      expect(payload.themeOverrides.images.splashIcon).toEqual({
        path: "events/7/n.jpg",
        url: "https://x/n.jpg",
        plate: "#000000",
      });
    });

    it("plate-only change keeps path/url and does not upload", async () => {
      const ev = withPlate();
      mockedGetEventById.mockResolvedValueOnce(ev);
      mockedUpdateEventById.mockResolvedValueOnce(undefined);
      render(<EventThemeSection eventId={7} initialThemeOverrides={ev.themeOverrides as any} />);

      setPlate("#101010");
      fireEvent.click(screen.getByRole("button", { name: "Guardar tema" }));
      await waitFor(() => expect(mockedUpdateEventById).toHaveBeenCalled());

      const [, payload] = mockedUpdateEventById.mock.calls[0];
      expect(payload.themeOverrides.images.splashIcon).toEqual({
        path: "s.png",
        url: "https://x/s.png",
        plate: "#101010",
      });
      expect(mockedCreateUploadUrl).not.toHaveBeenCalled();
      expect(payload.themeOverrides.decorativeIcon).toBe("flower");
    });

    it("clearing the plate drops the key", async () => {
      const ev = withPlate("#000000");
      mockedGetEventById.mockResolvedValueOnce(ev);
      mockedUpdateEventById.mockResolvedValueOnce(undefined);
      render(<EventThemeSection eventId={7} initialThemeOverrides={ev.themeOverrides as any} />);

      fireEvent.click(screen.getByRole("button", { name: "Sin color" }));
      fireEvent.click(screen.getByRole("button", { name: "Guardar tema" }));
      await waitFor(() => expect(mockedUpdateEventById).toHaveBeenCalled());

      const [, payload] = mockedUpdateEventById.mock.calls[0];
      expect(payload.themeOverrides.images.splashIcon).toEqual({ path: "s.png", url: "https://x/s.png" });
      expect("plate" in payload.themeOverrides.images.splashIcon).toBe(false);
    });

    it("removing the logo writes null even when a plate exists", async () => {
      const ev = withPlate("#000000");
      mockedGetEventById.mockResolvedValueOnce(ev);
      mockedUpdateEventById.mockResolvedValueOnce(undefined);
      render(<EventThemeSection eventId={7} initialThemeOverrides={ev.themeOverrides as any} />);

      fireEvent.click(screen.getByRole("button", { name: "Quitar logo" }));
      fireEvent.click(screen.getByRole("button", { name: "Guardar tema" }));
      await waitFor(() => expect(mockedUpdateEventById).toHaveBeenCalled());

      const [, payload] = mockedUpdateEventById.mock.calls[0];
      expect(payload.themeOverrides.images.splashIcon).toBeNull();
    });
  });
});
