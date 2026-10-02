// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ThemeSplashIconBlock from "../components/ThemeSplashIconBlock";

const setup = (overrides: Partial<React.ComponentProps<typeof ThemeSplashIconBlock>> = {}) => {
  const props = {
    previewUrl: null,
    onFileSelected: vi.fn(),
    onInvalidMime: vi.fn(),
    onRemove: vi.fn(),
    removeDisabled: false,
    plate: null,
    onPlateChange: vi.fn(),
    ...overrides,
  };
  render(<ThemeSplashIconBlock {...props} />);
  return props;
};

describe("ThemeSplashIconBlock", () => {
  it("shows the preview with object-fit contain, or an empty state", () => {
    setup({ previewUrl: "https://x/s.svg" });
    const img = screen.getByAltText("Logo actual del evento") as HTMLImageElement;
    expect(img.style.objectFit).toBe("contain");
  });

  it("shows an empty state without preview", () => {
    setup();
    expect(screen.getByText("Sin logo")).toBeTruthy();
  });

  it("accepts svg and forwards a valid file", () => {
    const props = setup();
    const input = screen.getByLabelText("Archivo del logo de bienvenida") as HTMLInputElement;
    expect(input.accept).toContain("image/svg+xml");
    const file = new File(["<svg/>"], "s.svg", { type: "image/svg+xml" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(props.onFileSelected).toHaveBeenCalledWith(file);
  });

  it("rejects unsupported mimes", () => {
    const props = setup();
    const file = new File(["x"], "s.gif", { type: "image/gif" });
    fireEvent.change(screen.getByLabelText("Archivo del logo de bienvenida"), {
      target: { files: [file] },
    });
    expect(props.onInvalidMime).toHaveBeenCalled();
    expect(props.onFileSelected).not.toHaveBeenCalled();
  });

  it("calls onRemove and respects removeDisabled", () => {
    const props = setup();
    fireEvent.click(screen.getByRole("button", { name: "Quitar logo" }));
    expect(props.onRemove).toHaveBeenCalled();
  });

  it("disables the plate controls without a logo", () => {
    setup({ previewUrl: null });
    expect((screen.getByLabelText("Color del círculo (selector)") as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText("Color del círculo") as HTMLInputElement).disabled).toBe(true);
  });

  it("emits a valid #RRGGBB plate and rejects invalid hex", () => {
    const props = setup({ previewUrl: "https://x/s.png" });
    const text = screen.getByLabelText("Color del círculo") as HTMLInputElement;
    fireEvent.change(text, { target: { value: "#12" } });
    fireEvent.change(text, { target: { value: "zzzzzz" } });
    expect(props.onPlateChange).not.toHaveBeenCalled();
    fireEvent.change(text, { target: { value: "#0A0B0c" } });
    expect(props.onPlateChange).toHaveBeenCalledWith("#0a0b0c");
  });

  it("clears the plate with 'Sin color'", () => {
    const props = setup({ previewUrl: "https://x/s.png", plate: "#000000" });
    fireEvent.click(screen.getByRole("button", { name: "Sin color" }));
    expect(props.onPlateChange).toHaveBeenCalledWith(null);
  });

  it("previews the plate background with contain + padding", () => {
    setup({ previewUrl: "https://x/s.png", plate: "#000000" });
    const circle = screen.getByTestId("splash-plate-preview");
    expect(circle.style.background).toContain("rgb(0, 0, 0)");
    const img = circle.querySelector("img") as HTMLImageElement;
    expect(img.style.objectFit).toBe("contain");
  });
});
