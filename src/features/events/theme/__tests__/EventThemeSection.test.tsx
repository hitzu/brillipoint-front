// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

import { getEventById, updateEventById } from "../../../../api/services/eventsService";
import { getEventTheme } from "../../../../api/services/partyPublicService";
import {
  createThemeAssetUploadUrl,
  uploadThemeAssetBlobToSignedUrl,
} from "../../../../api/services/themeAssetsService";
import EventThemeSection from "../EventThemeSection";

const mockedGetEventById = getEventById as unknown as ReturnType<typeof vi.fn>;
const mockedUpdateEventById = updateEventById as unknown as ReturnType<typeof vi.fn>;

const mockedGetEventTheme = getEventTheme as unknown as ReturnType<typeof vi.fn>;
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
  mockedGetEventTheme.mockReset();
  // The section always fetches the resolved theme when it has a token.
  mockedGetEventTheme.mockResolvedValue({ eventTheme: null });
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

  describe("social CTA", () => {
    const STORED_SOCIAL_CTA = {
      headline: { text: { es: "Hola" } },
      socials: {
        instagram: "https://instagram.com/old",
        tiktok: "https://www.tiktok.com/@old",
      },
    };
    const withSocialCta = {
      id: 7,
      themeOverrides: { ...FRESH_EVENT.themeOverrides, socialCta: STORED_SOCIAL_CTA },
    };

    const save = async () => {
      fireEvent.click(screen.getByRole("button", { name: "Guardar tema" }));
      await waitFor(() => expect(mockedUpdateEventById).toHaveBeenCalled());
      return mockedUpdateEventById.mock.calls[0][1].themeOverrides;
    };

    it("keeps the stored override in the form while still fetching the theme for the preview", async () => {
      mockedGetEventTheme.mockResolvedValueOnce({
        eventTheme: {
          tokens: { background: "#123456" },
          socialCta: { socials: { facebook: "https://facebook.com/kit" } },
        },
      });

      render(
        <EventThemeSection
          eventId={7}
          token="tok"
          initialThemeOverrides={withSocialCta.themeOverrides as any}
        />,
      );

      await waitFor(() =>
        expect(
          screen.getByTestId("social-cta-preview-surface").style.getPropertyValue("--ep-page-bg"),
        ).toBe("#123456"),
      );
      expect(mockedGetEventTheme).toHaveBeenCalledTimes(1);
      expect(mockedGetEventTheme).toHaveBeenCalledWith("tok", true);
      expect((screen.getByRole("switch", { name: "Instagram" }) as HTMLInputElement).checked).toBe(
        true,
      );
      expect(
        (screen.getByLabelText("Usuario o enlace de Instagram") as HTMLInputElement).value,
      ).toBe("https://instagram.com/old");
      expect((screen.getByRole("switch", { name: "Facebook" }) as HTMLInputElement).checked).toBe(
        false,
      );
      expect(screen.queryByText(/Heredado del tema/)).toBeNull();
      expect(screen.queryByText("socialCta")).toBeNull();
    });

    it("prefills from the resolved theme when there is no stored override", async () => {
      mockedGetEventTheme.mockResolvedValueOnce({
        eventTheme: {
          socialCta: {
            headline: { text: { es: "Del kit" } },
            socials: { facebook: "https://facebook.com/kit" },
          },
        },
      });

      render(
        <EventThemeSection
          eventId={7}
          token="tok"
          initialThemeOverrides={FRESH_EVENT.themeOverrides as any}
        />,
      );

      expect(await screen.findByText(/Heredado del tema/)).toBeTruthy();
      expect(mockedGetEventTheme).toHaveBeenCalledWith("tok", true);
      expect(
        (screen.getByLabelText("Usuario o enlace de Facebook") as HTMLInputElement).value,
      ).toBe("https://facebook.com/kit");
      expect((screen.getByLabelText(/Texto principal/) as HTMLInputElement).value).toBe("Del kit");
      expect(screen.queryByRole("button", { name: "Usar el heredado" })).toBeNull();
    });

    it("falls back to an empty form when the resolved theme fails to load", async () => {
      mockedGetEventTheme.mockRejectedValueOnce(new Error("offline"));

      render(
        <EventThemeSection
          eventId={7}
          token="tok"
          initialThemeOverrides={FRESH_EVENT.themeOverrides as any}
        />,
      );

      await waitFor(() => expect(mockedGetEventTheme).toHaveBeenCalled());
      expect((screen.getByRole("switch", { name: "Instagram" }) as HTMLInputElement).checked).toBe(
        false,
      );
      expect(screen.queryByText(/Heredado del tema/)).toBeNull();
      expect(
        (screen.getByRole("button", { name: "Guardar tema" }) as HTMLButtonElement).disabled,
      ).toBe(false);
    });

    it("saving untouched social CTA does not write socialCta", async () => {
      mockedGetEventById.mockResolvedValueOnce(FRESH_EVENT);
      mockedUpdateEventById.mockResolvedValueOnce(undefined);
      mockedGetEventTheme.mockResolvedValueOnce({
        eventTheme: { socialCta: { socials: { facebook: "https://facebook.com/kit" } } },
      });

      render(
        <EventThemeSection
          eventId={7}
          token="tok"
          initialThemeOverrides={FRESH_EVENT.themeOverrides as any}
        />,
      );
      await screen.findByText(/Heredado del tema/);

      const payload = await save();

      expect("socialCta" in payload).toBe(false);
    });

    it("saving an edited form replaces socialCta wholesale", async () => {
      mockedGetEventById.mockResolvedValueOnce(withSocialCta);
      mockedUpdateEventById.mockResolvedValueOnce(undefined);

      render(
        <EventThemeSection
          eventId={7}
          token="tok"
          initialThemeOverrides={withSocialCta.themeOverrides as any}
        />,
      );

      fireEvent.click(screen.getByRole("switch", { name: "TikTok" }));
      fireEvent.click(screen.getByRole("switch", { name: "Sitio web" }));
      fireEvent.change(screen.getByLabelText("Enlace de Sitio web"), {
        target: { value: "http://lusso.mx" },
      });

      const payload = await save();

      expect(payload.socialCta).toEqual({
        headline: { text: { es: "Hola" } },
        primaryAction: null,
        socials: {
          instagram: "https://instagram.com/old",
          url: "https://lusso.mx",
        },
      });
      expect(payload.decorativeIcon).toBe("flower");
      await screen.findByText("Tema actualizado exitosamente");
    });

    it("'Usar el heredado' removes the socialCta key on save", async () => {
      mockedGetEventById.mockResolvedValueOnce(withSocialCta);
      mockedUpdateEventById.mockResolvedValueOnce(undefined);
      mockedGetEventTheme.mockResolvedValue({ eventTheme: { socialCta: null } });

      render(
        <EventThemeSection
          eventId={7}
          token="tok"
          initialThemeOverrides={withSocialCta.themeOverrides as any}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Usar el heredado" }));
      const payload = await save();

      expect("socialCta" in payload).toBe(false);
      expect(payload.decorativeIcon).toBe("flower");
    });

    it("live-previews the edited texts with the honorees name and the editor locale", () => {
      render(
        <EventThemeSection
          eventId={7}
          token="tok"
          honoreesNames=" Ana y Luis "
          initialThemeOverrides={withSocialCta.themeOverrides as any}
        />,
      );

      const preview = screen.getByRole("region", { name: "Vista previa de redes sociales y CTA" });
      expect(within(preview).getByText("Hola")).toBeTruthy();

      fireEvent.change(screen.getByLabelText(/Texto principal/), {
        target: { value: "Gracias, {{honoreesName}}" },
      });
      expect(within(preview).getByText("Gracias, Ana y Luis")).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: "EN" }));
      // No English headline yet: the preview falls back to Spanish.
      expect(within(preview).getByText("Gracias, Ana y Luis")).toBeTruthy();
      expect(within(preview).getByText("EN")).toBeTruthy();
    });

    it("themes the preview with the resolved event theme it already fetched", async () => {
      mockedGetEventTheme.mockResolvedValueOnce({
        eventTheme: {
          tokens: { background: "#123456", primary: "#aa0000" },
          socialCta: { socials: { facebook: "https://facebook.com/kit" } },
        },
      });

      render(
        <EventThemeSection
          eventId={7}
          token="tok"
          initialThemeOverrides={FRESH_EVENT.themeOverrides as any}
        />,
      );

      await screen.findByText(/Heredado del tema/);
      const surface = screen.getByTestId("social-cta-preview-surface");
      expect(surface.style.getPropertyValue("--ep-page-bg")).toBe("#123456");
      expect(mockedGetEventTheme).toHaveBeenCalledTimes(1);
    });

    it("blocks saving while the form has errors", () => {
      render(
        <EventThemeSection
          eventId={7}
          token="tok"
          initialThemeOverrides={withSocialCta.themeOverrides as any}
        />,
      );

      fireEvent.click(screen.getByRole("switch", { name: "WhatsApp" }));

      expect(screen.getByText("Escribe el número de WhatsApp.")).toBeTruthy();
      expect(
        (screen.getByRole("button", { name: "Guardar tema" }) as HTMLButtonElement).disabled,
      ).toBe(true);
    });
  });
});
