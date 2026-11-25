// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { AxiosError } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const service = vi.hoisted(() => ({
  getPublicPrepProfile: vi.fn(),
  setPublicPrepProfileTattooDesigns: vi.fn(),
  createPublicPrepProfileUploadUrl: vi.fn(),
  uploadPrepProfileFileToSignedUrl: vi.fn(),
}));
vi.mock("../../../api/services/prepProfileService", () => service);

const catalogService = vi.hoisted(() => ({
  getTattooCatalog: vi.fn(),
}));
vi.mock("../../../api/services/tattooCatalogService", () => catalogService);

// react-cropper needs a real canvas; the stub exposes a controllable instance.
const cropper = vi.hoisted(() => ({
  instance: {
    getData: vi.fn(),
    getImageData: vi.fn(),
    getCroppedCanvas: vi.fn(),
  },
}));
vi.mock("react-cropper", async () => {
  const React = await import("react");
  const Cropper = React.forwardRef(
    (props: { ready?: () => void }, ref: React.ForwardedRef<unknown>) => {
      React.useImperativeHandle(ref, () => ({ cropper: cropper.instance }));
      React.useEffect(() => {
        props.ready?.();
      }, []);
      return React.createElement("div", { "data-testid": "cropper" });
    },
  );
  return { default: Cropper, Cropper };
});

vi.mock("../utils/cropImage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../utils/cropImage")>()),
  canDecodeImage: vi.fn(),
  canvasToCroppedFile: vi.fn(),
}));

import { canDecodeImage, canvasToCroppedFile } from "../utils/cropImage";
import { TattooDesignsSection } from "./TattooDesignsSection";

const asset = (n: number) => ({
  path: `7/tattoo_designs/${n}.png`,
  mime: "image/png",
  url: `https://cdn.example/${n}.png`,
});

const profile = (
  designs: ReturnType<typeof asset>[],
  locked = false,
  chosen: Array<{ carouselId: number; title: string; imageUrl: string }> = [],
) => ({
  contractId: 7,
  answers: { tattoo_designs: designs, tattoo_catalog_designs: chosen },
  locked: locked ? { tattoo_designs: true } : {},
});

const catalogItem = (n: number) => ({
  id: n,
  title: `Diseño catálogo ${n}`,
  imageUrl: `https://cdn.example/catalog-${n}.png`,
});
const choice = (n: number) => ({
  carouselId: n,
  title: `Diseño catálogo ${n}`,
  imageUrl: `https://cdn.example/catalog-${n}.png`,
});

beforeEach(() => {
  window.localStorage.clear();
  Object.values(service).forEach((fn) => fn.mockReset());
  catalogService.getTattooCatalog.mockReset();
  catalogService.getTattooCatalog.mockResolvedValue([]);
  Object.values(cropper.instance).forEach((fn) => fn.mockReset());
  // Untouched crop box by default: the whole 400x300 image.
  cropper.instance.getData.mockReturnValue({ x: 0, y: 0, width: 400, height: 300 });
  cropper.instance.getImageData.mockReturnValue({ naturalWidth: 400, naturalHeight: 300 });
  cropper.instance.getCroppedCanvas.mockReturnValue({});
  vi.mocked(canDecodeImage).mockReset().mockResolvedValue(true);
  vi.mocked(canvasToCroppedFile).mockReset();
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

describe("TattooDesignsSection", () => {
  it("keeps Continuar disabled until the phone has 10 digits", () => {
    render(<TattooDesignsSection contractToken="tok" phone="2222232323" />);
    const input = screen.getByLabelText("Celular del contrato (10 dígitos)");
    const button = screen.getByRole("button", { name: "Continuar" }) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
    fireEvent.change(input, { target: { value: "222223232" } });
    expect(button.disabled).toBe(true);
    fireEvent.change(input, { target: { value: "2222232323" } });
    expect(button.disabled).toBe(false);
    expect(screen.getByText(/Número registrado en el contrato: \*+2323/)).toBeTruthy();
  });

  it("asks for the phone first and rejects a wrong number", async () => {
    service.getPublicPrepProfile.mockRejectedValue(new Error("404"));
    render(<TattooDesignsSection contractToken="tok" phone="2222232323" />);

    fireEvent.change(screen.getByLabelText("Celular del contrato (10 dígitos)"), {
      target: { value: "0000000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain("Número incorrecto"),
    );
    expect(screen.queryByText(/Diseños de tatuajes/)).toBeNull();
  });

  it("loads the saved designs after the phone is validated", async () => {
    service.getPublicPrepProfile.mockResolvedValue(profile([asset(1), asset(2)]));
    render(<TattooDesignsSection contractToken="tok" phone="2222232323" />);

    fireEvent.change(screen.getByLabelText("Celular del contrato (10 dígitos)"), {
      target: { value: "222-223-2323" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    await waitFor(() => expect(screen.getByText("2 de 10")).toBeTruthy());
    expect(service.getPublicPrepProfile).toHaveBeenCalledWith({
      contractToken: "tok",
      phone: "2222232323",
    });
  });

  it("reuses the phone already verified in the preparation tabs", async () => {
    window.localStorage.setItem("prep-profile:phone:tok", "2222232323");
    service.getPublicPrepProfile.mockResolvedValue(profile([asset(1)]));
    render(<TattooDesignsSection contractToken="tok" />);

    await waitFor(() => expect(screen.getByText("1 de 10")).toBeTruthy());
  });

  it("is read-only when the API reports the window as closed", async () => {
    window.localStorage.setItem("prep-profile:phone:tok", "2222232323");
    service.getPublicPrepProfile.mockResolvedValue(profile([asset(1)], true));
    render(<TattooDesignsSection contractToken="tok" />);

    await waitFor(() => expect(screen.getByRole("status")).toBeTruthy());
    expect(screen.queryByRole("button", { name: /Quitar de mis diseños/ })).toBeNull();
  });

  it("deletes a design by saving the remaining list", async () => {
    window.localStorage.setItem("prep-profile:phone:tok", "2222232323");
    service.getPublicPrepProfile.mockResolvedValue(profile([asset(1), asset(2)]));
    service.setPublicPrepProfileTattooDesigns.mockResolvedValue(profile([asset(2)]));
    render(<TattooDesignsSection contractToken="tok" />);

    await waitFor(() => expect(screen.getByText("2 de 10")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Quitar de mis diseños: Diseño 1" }));

    await waitFor(() => expect(screen.getByText("1 de 10")).toBeTruthy());
    expect(service.setPublicPrepProfileTattooDesigns).toHaveBeenCalledWith({
      contractToken: "tok",
      phone: "2222232323",
      assets: [{ path: "7/tattoo_designs/2.png", mime: "image/png" }],
    });
  });

  describe("selection bar", () => {
    const verified = () =>
      window.localStorage.setItem("prep-profile:phone:tok", "2222232323");
    const bar = () => screen.getByRole("region", { name: "Tu selección" });

    it("shows the counters and says changes save by themselves once the phone gate is passed", async () => {
      verified();
      service.getPublicPrepProfile.mockResolvedValue(
        profile([asset(1), asset(2)], false, [choice(5)]),
      );
      render(<TattooDesignsSection contractToken="tok" />);

      await waitFor(() =>
        expect(within(bar()).getByText("Subidas 2 de 10")).toBeTruthy(),
      );
      expect(within(bar()).getByText("Templates 1 de 10")).toBeTruthy();
      expect(within(bar()).getByText("Tus cambios se guardan solos")).toBeTruthy();
    });

    it("does not show the bar before the phone is validated", () => {
      render(<TattooDesignsSection contractToken="tok" phone="2222232323" />);

      expect(screen.queryByRole("region", { name: "Tu selección" })).toBeNull();
    });

    it("goes saving, then saved, and the counters follow when removing a design", async () => {
      verified();
      service.getPublicPrepProfile.mockResolvedValue(profile([asset(1), asset(2)]));
      let finishSave!: (value: ReturnType<typeof profile>) => void;
      service.setPublicPrepProfileTattooDesigns.mockReturnValue(
        new Promise((resolve) => {
          finishSave = resolve;
        }),
      );
      render(<TattooDesignsSection contractToken="tok" />);
      await waitFor(() => expect(within(bar()).getByText("Subidas 2 de 10")).toBeTruthy());

      fireEvent.click(
        screen.getByRole("button", { name: "Quitar de mis diseños: Diseño 1" }),
      );

      await waitFor(() => expect(within(bar()).getByText("Guardando…")).toBeTruthy());
      expect(screen.queryByText("Guardando...")).toBeNull();

      finishSave(profile([asset(2)]));

      await waitFor(() => expect(within(bar()).getByText("Guardado ✓")).toBeTruthy());
      expect(within(bar()).getByText("Subidas 1 de 10")).toBeTruthy();
    });

    it("goes saving, then saved, when choosing from the catalog", async () => {
      verified();
      service.getPublicPrepProfile.mockResolvedValue(profile([]));
      catalogService.getTattooCatalog.mockResolvedValue([catalogItem(5)]);
      service.setPublicPrepProfileTattooDesigns.mockResolvedValue(
        profile([], false, [choice(5)]),
      );
      render(<TattooDesignsSection contractToken="tok" />);

      fireEvent.click(
        await screen.findByRole("button", { name: "Elegir Diseño catálogo 5" }),
      );

      await waitFor(() => expect(within(bar()).getByText("Guardado ✓")).toBeTruthy());
      expect(within(bar()).getByText("Templates 1 de 10")).toBeTruthy();
    });

    it("shows the failure in the bar and keeps the message in the card", async () => {
      verified();
      service.getPublicPrepProfile.mockResolvedValue(profile([asset(1)]));
      service.setPublicPrepProfileTattooDesigns.mockRejectedValue(new Error("500"));
      render(<TattooDesignsSection contractToken="tok" />);
      await waitFor(() => expect(within(bar()).getByText("Subidas 1 de 10")).toBeTruthy());

      fireEvent.click(
        screen.getByRole("button", { name: "Quitar de mis diseños: Diseño 1" }),
      );

      await waitFor(() => expect(within(bar()).getByText("No se pudo guardar")).toBeTruthy());
      expect(screen.getByRole("alert").textContent).toBe(
        "No se pudieron guardar los diseños. Intenta de nuevo.",
      );
      expect(within(bar()).getByText("Subidas 1 de 10")).toBeTruthy();
    });

    it("says it is closed when the API reports the window as closed", async () => {
      verified();
      service.getPublicPrepProfile.mockResolvedValue(profile([asset(1)], true));
      render(<TattooDesignsSection contractToken="tok" />);

      await waitFor(() =>
        expect(within(bar()).getByText("Cerrado: ya no se pueden modificar")).toBeTruthy(),
      );
      expect(screen.queryByRole("button", { name: /Quitar de mis diseños/ })).toBeNull();
    });

    it("says it is closed once a 409 arrives while saving", async () => {
      verified();
      service.getPublicPrepProfile.mockResolvedValue(profile([asset(1)]));
      service.setPublicPrepProfileTattooDesigns.mockRejectedValue(
        new AxiosError("locked", "409", undefined, undefined, { status: 409 } as never),
      );
      render(<TattooDesignsSection contractToken="tok" />);
      await waitFor(() => expect(within(bar()).getByText("Subidas 1 de 10")).toBeTruthy());

      fireEvent.click(
        screen.getByRole("button", { name: "Quitar de mis diseños: Diseño 1" }),
      );

      await waitFor(() =>
        expect(within(bar()).getByText("Cerrado: ya no se pueden modificar")).toBeTruthy(),
      );
      expect(screen.queryByRole("button", { name: /Quitar de mis diseños/ })).toBeNull();
    });

    it("opens the summary with what was already saved", async () => {
      verified();
      service.getPublicPrepProfile.mockResolvedValue(profile([asset(1)]));
      render(<TattooDesignsSection contractToken="tok" eventDate="2026-12-20" />);

      fireEvent.click(await screen.findByRole("button", { name: "Ver seleccionado" }));

      const dialog = screen.getByRole("dialog", { name: "Lo que llevas elegido" });
      expect(within(dialog).getByRole("img", { name: "Diseño 1" })).toBeTruthy();
      expect(within(dialog).getByText(/Puedes hacer cambios hasta el 12 de diciembre/)).toBeTruthy();
    });
  });

  describe("crop before upload", () => {
    const verified = () =>
      window.localStorage.setItem("prep-profile:phone:tok", "2222232323");

    const png = (name: string) => new File(["png-bytes"], name, { type: "image/png" });

    const chooseFiles = async (files: File[]) => {
      await screen.findByText("Sube tus fotos o diseños");
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files } });
    };

    const mockUploads = () => {
      let n = 0;
      service.createPublicPrepProfileUploadUrl.mockImplementation(async () => {
        n += 1;
        return { signedUrl: `https://signed/${n}`, path: `7/tattoo_designs/new-${n}` };
      });
      service.uploadPrepProfileFileToSignedUrl.mockResolvedValue(undefined);
    };

    it("opens the crop for every chosen image, one by one, before uploading anything", async () => {
      verified();
      service.getPublicPrepProfile.mockResolvedValue(profile([]));
      render(<TattooDesignsSection contractToken="tok" />);

      await chooseFiles([png("a.png"), png("b.png")]);

      const dialog = await screen.findByRole("dialog", { name: /Recortar/ });
      expect(within(dialog).getByText("Imagen 1 de 2")).toBeTruthy();
      expect(within(dialog).getByRole("button", { name: "Listo" })).toBeTruthy();
      expect(within(dialog).getByRole("button", { name: "Cancelar" })).toBeTruthy();
      expect(service.createPublicPrepProfileUploadUrl).not.toHaveBeenCalled();
    });

    it("uploads the original file untouched when the box was not moved (no re-encode)", async () => {
      verified();
      mockUploads();
      service.getPublicPrepProfile.mockResolvedValue(profile([asset(1)]));
      service.setPublicPrepProfileTattooDesigns.mockResolvedValue(
        profile([asset(1), asset(2)]),
      );
      render(<TattooDesignsSection contractToken="tok" />);
      const original = png("diseno.png");

      await chooseFiles([original]);
      fireEvent.click(await screen.findByRole("button", { name: "Listo" }));

      await waitFor(() =>
        expect(service.setPublicPrepProfileTattooDesigns).toHaveBeenCalledTimes(1),
      );
      expect(canvasToCroppedFile).not.toHaveBeenCalled();
      expect(service.createPublicPrepProfileUploadUrl).toHaveBeenCalledWith({
        contractToken: "tok",
        phone: "2222232323",
        payload: {
          questionId: "tattoo_designs",
          fileName: "diseno.png",
          mime: "image/png",
        },
      });
      expect(service.uploadPrepProfileFileToSignedUrl).toHaveBeenCalledWith({
        signedUrl: "https://signed/1",
        file: original,
        mime: "image/png",
      });
      expect(service.setPublicPrepProfileTattooDesigns).toHaveBeenCalledWith({
        contractToken: "tok",
        phone: "2222232323",
        assets: [
          { path: "7/tattoo_designs/1.png", mime: "image/png" },
          { path: "7/tattoo_designs/new-1", mime: "image/png" },
        ],
      });
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    it("uploads only the cropped file when the box was adjusted, never the original", async () => {
      verified();
      mockUploads();
      service.getPublicPrepProfile.mockResolvedValue(profile([]));
      service.setPublicPrepProfileTattooDesigns.mockResolvedValue(profile([asset(1)]));
      cropper.instance.getData.mockReturnValue({ x: 40, y: 30, width: 200, height: 150 });
      const original = new File(["heic"], "selfie.jpeg", { type: "image/jpeg" });
      const cropped = new File(["cropped"], "selfie.jpg", { type: "image/jpeg" });
      vi.mocked(canvasToCroppedFile).mockResolvedValue(cropped);
      render(<TattooDesignsSection contractToken="tok" />);

      await chooseFiles([original]);
      fireEvent.click(await screen.findByRole("button", { name: "Listo" }));

      await waitFor(() =>
        expect(service.setPublicPrepProfileTattooDesigns).toHaveBeenCalledTimes(1),
      );
      expect(canvasToCroppedFile).toHaveBeenCalledWith({}, original);
      expect(service.createPublicPrepProfileUploadUrl).toHaveBeenCalledTimes(1);
      expect(service.createPublicPrepProfileUploadUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: {
            questionId: "tattoo_designs",
            fileName: "selfie.jpg",
            mime: "image/jpeg",
          },
        }),
      );
      expect(service.uploadPrepProfileFileToSignedUrl).toHaveBeenCalledWith({
        signedUrl: "https://signed/1",
        file: cropped,
        mime: "image/jpeg",
      });
    });

    it("skips an image without uploading it and goes on with the next", async () => {
      verified();
      mockUploads();
      service.getPublicPrepProfile.mockResolvedValue(profile([]));
      service.setPublicPrepProfileTattooDesigns.mockResolvedValue(profile([asset(1)]));
      render(<TattooDesignsSection contractToken="tok" />);

      await chooseFiles([png("primera.png"), png("segunda.png")]);
      fireEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
      expect(await screen.findByText("Imagen 2 de 2")).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Listo" }));

      await waitFor(() =>
        expect(service.setPublicPrepProfileTattooDesigns).toHaveBeenCalledTimes(1),
      );
      expect(service.createPublicPrepProfileUploadUrl).toHaveBeenCalledTimes(1);
      expect(service.createPublicPrepProfileUploadUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ fileName: "segunda.png" }),
        }),
      );
    });

    it("checks the 10-upload cap before opening any crop", async () => {
      verified();
      service.getPublicPrepProfile.mockResolvedValue(
        profile([1, 2, 3, 4, 5, 6, 7, 8, 9].map(asset)),
      );
      render(<TattooDesignsSection contractToken="tok" />);

      await chooseFiles([png("a.png"), png("b.png")]);

      await waitFor(() =>
        expect(screen.getByRole("alert").textContent).toBe(
          "Solo puedes subir hasta 10 fotos y diseños.",
        ),
      );
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(service.createPublicPrepProfileUploadUrl).not.toHaveBeenCalled();
    });

    it("rejects anything that is not an image before opening any crop", async () => {
      verified();
      service.getPublicPrepProfile.mockResolvedValue(profile([]));
      render(<TattooDesignsSection contractToken="tok" />);

      await chooseFiles([new File(["x"], "nota.pdf", { type: "application/pdf" })]);

      await waitFor(() =>
        expect(screen.getByRole("alert").textContent).toBe("Solo puedes subir imágenes."),
      );
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("drops an image the browser cannot open without telling the client", async () => {
      verified();
      mockUploads();
      vi.mocked(canDecodeImage).mockResolvedValue(false);
      service.getPublicPrepProfile.mockResolvedValue(profile([]));
      render(<TattooDesignsSection contractToken="tok" />);

      await chooseFiles([new File(["heic"], "selfie.heic", { type: "image/heic" })]);

      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(screen.queryByRole("alert")).toBeNull();
      expect(service.createPublicPrepProfileUploadUrl).not.toHaveBeenCalled();
    });
  });

  describe("catalog gallery", () => {
    const verified = () =>
      window.localStorage.setItem("prep-profile:phone:tok", "2222232323");

    it("shows the catalog once the phone is validated", async () => {
      verified();
      service.getPublicPrepProfile.mockResolvedValue(profile([]));
      catalogService.getTattooCatalog.mockResolvedValue([
        catalogItem(1),
        catalogItem(2),
      ]);
      render(<TattooDesignsSection contractToken="tok" />);

      await waitFor(() =>
        expect(screen.getByText("Catálogo de diseños", { selector: "h3" })).toBeTruthy(),
      );
      expect(
        screen.getByRole("button", { name: "Elegir Diseño catálogo 2" }),
      ).toBeTruthy();
    });

    it("chooses a design by saving the uploads plus the chosen ids", async () => {
      verified();
      service.getPublicPrepProfile.mockResolvedValue(profile([asset(1)]));
      catalogService.getTattooCatalog.mockResolvedValue([catalogItem(5)]);
      service.setPublicPrepProfileTattooDesigns.mockResolvedValue(
        profile([asset(1)], false, [choice(5)]),
      );
      render(<TattooDesignsSection contractToken="tok" />);

      fireEvent.click(
        await screen.findByRole("button", { name: "Elegir Diseño catálogo 5" }),
      );

      await waitFor(() =>
        expect(screen.getAllByText("1 de 10", { selector: "span" })).toHaveLength(2),
      );
      expect(service.setPublicPrepProfileTattooDesigns).toHaveBeenCalledWith({
        contractToken: "tok",
        phone: "2222232323",
        assets: [{ path: "7/tattoo_designs/1.png", mime: "image/png" }],
        catalogDesignIds: [5],
      });
    });

    it("unchooses a design by saving the remaining chosen ids", async () => {
      verified();
      service.getPublicPrepProfile.mockResolvedValue(
        profile([], false, [choice(1), choice(2)]),
      );
      catalogService.getTattooCatalog.mockResolvedValue([
        catalogItem(1),
        catalogItem(2),
      ]);
      service.setPublicPrepProfileTattooDesigns.mockResolvedValue(
        profile([], false, [choice(2)]),
      );
      render(<TattooDesignsSection contractToken="tok" />);

      fireEvent.click(
        await screen.findByRole("button", { name: "Quitar Diseño catálogo 1" }),
      );

      await waitFor(() =>
        expect(screen.getByText("1 de 10")).toBeTruthy(),
      );
      expect(service.setPublicPrepProfileTattooDesigns).toHaveBeenCalledWith({
        contractToken: "tok",
        phone: "2222232323",
        assets: [],
        catalogDesignIds: [2],
      });
    });

    it("goes read-only when the API says the window closed while choosing", async () => {
      verified();
      service.getPublicPrepProfile.mockResolvedValue(profile([]));
      catalogService.getTattooCatalog.mockResolvedValue([catalogItem(1)]);
      service.setPublicPrepProfileTattooDesigns.mockRejectedValue(
        new AxiosError("locked", "409", undefined, undefined, {
          status: 409,
        } as never),
      );
      render(<TattooDesignsSection contractToken="tok" />);

      fireEvent.click(
        await screen.findByRole("button", { name: "Elegir Diseño catálogo 1" }),
      );

      await waitFor(() =>
        expect(screen.getByRole("status")).toBeTruthy(),
      );
      expect(
        screen.queryByText("Catálogo de diseños", { selector: "h3" }),
      ).toBeNull();
    });

    it("still works when the catalog cannot be loaded (uploads only)", async () => {
      verified();
      service.getPublicPrepProfile.mockResolvedValue(profile([asset(1)]));
      catalogService.getTattooCatalog.mockRejectedValue(new Error("500"));
      render(<TattooDesignsSection contractToken="tok" />);

      await waitFor(() =>
        expect(screen.getByText("1 de 10")).toBeTruthy(),
      );
      expect(screen.queryByText("Catálogo de diseños", { selector: "h3" })).toBeNull();
    });
  });
});
