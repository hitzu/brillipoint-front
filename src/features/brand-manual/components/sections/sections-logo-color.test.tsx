// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ColorSection } from "./ColorSection";
import { LogoSection } from "./LogoSection";

const noop = () => undefined;

describe("LogoSection", () => {
  const verdictText = () => screen.getByTestId("logo-verdict").textContent;

  it("approves the neon logo on black at 200 px by default", () => {
    render(<LogoSection line="light" onLineChange={noop} notify={noop} />);
    expect(screen.getByRole("radio", { name: /Principal · neón/ }).getAttribute("aria-checked")).toBe("true");
    expect(verdictText()).toMatch(/^SE PUEDE/);
  });

  it("explains why the white logo can't go on ivory", () => {
    render(<LogoSection line="light" onLineChange={noop} notify={noop} />);
    fireEvent.click(screen.getByRole("radio", { name: "Marfil" }));
    expect(verdictText()).toMatch(/^NOEl logo blanco desaparece sobre marfil/);
    expect(screen.getByText("FONDO · MARFIL")).toBeTruthy();
  });

  it("rejects the glow when the logo is resized below 160 px", () => {
    render(<LogoSection line="light" onLineChange={noop} notify={noop} />);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "120" } });
    expect(screen.getByText("120 px", { selector: "output" })).toBeTruthy();
    expect(verdictText()).toMatch(/160 px o más/);
  });

  it("draws the protection area on demand", () => {
    render(<LogoSection line="light" onLineChange={noop} notify={noop} />);
    const guard = screen.getByText("AIRE MÍNIMO · ALTO DE LA B ÷ 2").parentElement!;
    expect(guard.getAttribute("data-guard")).toBe("off");
    fireEvent.click(screen.getByLabelText("Área de protección"));
    expect(guard.getAttribute("data-guard")).toBe("on");
  });
});

describe("ColorSection", () => {
  it("shows the active line's values with HEX, RGB and CMYK", () => {
    const { rerender } = render(<ColorSection line="light" onLineChange={noop} notify={noop} />);
    expect(screen.getByText("VALORES DE PHOTOBOOTH · CLARO")).toBeTruthy();
    const background = screen.getByRole("button", { name: /^Fondo, surface-100/ });
    expect(within(background).getByText("HEX #FBF8F3")).toBeTruthy();
    expect(within(background).getByText("RGB 251 248 243")).toBeTruthy();
    expect(within(background).getByText("CMYK 0 1 3 2")).toBeTruthy();

    rerender(<ColorSection line="dark" onLineChange={noop} notify={noop} />);
    expect(screen.getByText("VALORES DE GLITTER BAR · NOCHE")).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Fondo, surface-100, #0C0B0A/ })).toBeTruthy();
  });

  it("copies a swatch HEX and confirms it", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const notify = vi.fn();
    render(<ColorSection line="light" onLineChange={noop} notify={notify} />);

    fireEvent.click(screen.getByRole("button", { name: /^Dorado champagne, gold-500/ }));

    expect(writeText).toHaveBeenCalledWith("#D9B56E");
    await waitFor(() => expect(notify).toHaveBeenCalledWith("Copiado: #D9B56E"));
  });

  it("checks a text and background pair against contrast and brand rules", () => {
    render(<ColorSection line="light" onLineChange={noop} notify={noop} />);
    const verdict = () => screen.getByTestId("fit-verdict").textContent;
    expect(verdict()).toMatch(/^NO1\.8:1 · En claro, gold-500 no es para texto/);

    fireEvent.change(screen.getByLabelText("Texto"), { target: { value: "ink" } });
    expect(verdict()).toMatch(/^SE PUEDE17\.9:1/);
  });
});
