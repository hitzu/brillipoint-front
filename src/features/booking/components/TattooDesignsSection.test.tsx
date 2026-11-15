// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const service = vi.hoisted(() => ({
  getPublicPrepProfile: vi.fn(),
  setPublicPrepProfileTattooDesigns: vi.fn(),
  createPublicPrepProfileUploadUrl: vi.fn(),
  uploadPrepProfileFileToSignedUrl: vi.fn(),
}));
vi.mock("../../../api/services/prepProfileService", () => service);

import { TattooDesignsSection } from "./TattooDesignsSection";

const asset = (n: number) => ({
  path: `7/tattoo_designs/${n}.png`,
  mime: "image/png",
  url: `https://cdn.example/${n}.png`,
});

const profile = (designs: ReturnType<typeof asset>[], locked = false) => ({
  contractId: 7,
  answers: { tattoo_designs: designs },
  locked: locked ? { tattoo_designs: true } : {},
});

beforeEach(() => {
  window.localStorage.clear();
  Object.values(service).forEach((fn) => fn.mockReset());
});
afterEach(cleanup);

describe("TattooDesignsSection", () => {
  it("asks for the phone first and rejects a wrong number", async () => {
    service.getPublicPrepProfile.mockRejectedValue(new Error("404"));
    render(<TattooDesignsSection contractToken="tok" phone="2222232323" />);

    fireEvent.change(screen.getByLabelText("Número de celular"), {
      target: { value: "000" },
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

    fireEvent.change(screen.getByLabelText("Número de celular"), {
      target: { value: "222-223-2323" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    await waitFor(() => expect(screen.getByText("2 de 5 diseños")).toBeTruthy());
    expect(service.getPublicPrepProfile).toHaveBeenCalledWith({
      contractToken: "tok",
      phone: "2222232323",
    });
  });

  it("reuses the phone already verified in the preparation tabs", async () => {
    window.localStorage.setItem("prep-profile:phone:tok", "2222232323");
    service.getPublicPrepProfile.mockResolvedValue(profile([asset(1)]));
    render(<TattooDesignsSection contractToken="tok" />);

    await waitFor(() => expect(screen.getByText("1 de 5 diseños")).toBeTruthy());
  });

  it("is read-only when the API reports the window as closed", async () => {
    window.localStorage.setItem("prep-profile:phone:tok", "2222232323");
    service.getPublicPrepProfile.mockResolvedValue(profile([asset(1)], true));
    render(<TattooDesignsSection contractToken="tok" />);

    await waitFor(() => expect(screen.getByRole("status")).toBeTruthy());
    expect(screen.queryByRole("button", { name: /Eliminar diseño/ })).toBeNull();
  });

  it("deletes a design by saving the remaining list", async () => {
    window.localStorage.setItem("prep-profile:phone:tok", "2222232323");
    service.getPublicPrepProfile.mockResolvedValue(profile([asset(1), asset(2)]));
    service.setPublicPrepProfileTattooDesigns.mockResolvedValue(profile([asset(2)]));
    render(<TattooDesignsSection contractToken="tok" />);

    await waitFor(() => expect(screen.getByText("2 de 5 diseños")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Eliminar diseño 1" }));

    await waitFor(() => expect(screen.getByText("1 de 5 diseños")).toBeTruthy());
    expect(service.setPublicPrepProfileTattooDesigns).toHaveBeenCalledWith({
      contractToken: "tok",
      phone: "2222232323",
      assets: [{ path: "7/tattoo_designs/2.png", mime: "image/png" }],
    });
  });
});
