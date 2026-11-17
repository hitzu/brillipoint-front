// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
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

const catalogService = vi.hoisted(() => ({ getTattooCatalog: vi.fn() }));
vi.mock("../../../api/services/tattooCatalogService", () => catalogService);

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
        expect(screen.getByText("¿Sin tiempo? Elige de nuestro catálogo")).toBeTruthy(),
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
        expect(screen.getByText("2 de 10")).toBeTruthy(),
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
        screen.queryByText("¿Sin tiempo? Elige de nuestro catálogo"),
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
      expect(screen.queryByText("¿Sin tiempo? Elige de nuestro catálogo")).toBeNull();
    });
  });
});
