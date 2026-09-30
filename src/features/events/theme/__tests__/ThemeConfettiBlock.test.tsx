// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ThemeConfettiBlock from "../components/ThemeConfettiBlock";
import { CONFETTI_SHAPES } from "../../../party/theme/confettiShapes";

describe("ThemeConfettiBlock", () => {
  it("groups contained native checkboxes without Bootstrap's floated check layout", () => {
    render(
      <ThemeConfettiBlock selectedShapes={["heart"]} onToggleShape={vi.fn()} />
    );
    const group = screen.getByRole("group", { name: "Formas del confeti" });
    expect(group.querySelectorAll('input[type="checkbox"]')).toHaveLength(
      CONFETTI_SHAPES.length
    );
    for (const input of Array.from(group.querySelectorAll("input"))) {
      expect(input.closest("label")).not.toBeNull();
      expect(input.classList.contains("form-check-input")).toBe(false);
    }
    expect(
      (screen.getByRole("checkbox", { name: "Corazón" }) as HTMLInputElement)
        .checked
    ).toBe(true);
    expect(
      (screen.getByRole("checkbox", { name: "Estrella" }) as HTMLInputElement)
        .checked
    ).toBe(false);
  });

  it("toggles via the full label and keeps selection controlled by the parent", () => {
    const onToggleShape = vi.fn();
    const { rerender } = render(
      <ThemeConfettiBlock selectedShapes={[]} onToggleShape={onToggleShape} />
    );
    const input = screen.getByRole("checkbox", {
      name: "Corazón",
    }) as HTMLInputElement;
    fireEvent.click(input.closest("label")!);
    expect(onToggleShape).toHaveBeenCalledExactlyOnceWith("heart");
    expect(input.checked).toBe(false);
    rerender(
      <ThemeConfettiBlock
        selectedShapes={["heart"]}
        onToggleShape={onToggleShape}
      />
    );
    expect(input.checked).toBe(true);
  });

  it("keeps multiple selectors independent and icons decorative", () => {
    const { container } = render(
      <>
        <ThemeConfettiBlock selectedShapes={[]} onToggleShape={vi.fn()} />
        <ThemeConfettiBlock
          selectedShapes={["heart"]}
          onToggleShape={vi.fn()}
        />
      </>
    );
    const ids = Array.from(container.querySelectorAll("input")).map(
      (input) => input.id
    );
    expect(new Set(ids).size).toBe(ids.length);
    for (const svg of Array.from(container.querySelectorAll("svg"))) {
      expect(svg.closest('[aria-hidden="true"]')).not.toBeNull();
    }
  });

  it("defines responsive touch targets, theme surfaces, and keyboard focus", () => {
    // jsdom cannot lay out CSS; guard the regression-critical style contract here.
    const css = readFileSync(
      "src/features/events/theme/components/ThemeConfettiBlock.module.css",
      "utf8"
    );
    expect(css).toMatch(/min-height:\s*44px/);
    expect(css).toMatch(/grid-template-columns:\s*repeat\(auto-fit,/);
    expect(css).toContain("minmax(min(100%, 176px), 1fr)");
    expect(css).not.toContain("overflow-wrap: anywhere");
    expect(css).toContain("var(--bs-body-bg)");
    expect(css).toContain("var(--bs-body-color)");
    expect(css).toContain(":focus-within");
    expect(css).toMatch(/outline:\s*\d+px solid/);
    expect(css).toMatch(/width:\s*24px/);
    expect(css).toMatch(/float:\s*none/);
    expect(css).toMatch(/margin:\s*0/);
  });
});

describe("detailed confetti presentation", () => {
  it("renders every new figure with a Spanish label and an SVG preview", () => {
    render(<ThemeConfettiBlock selectedShapes={[]} onToggleShape={vi.fn()} />);
    for (const name of ["Diamante", "Moño", "Mariposa", "Cámara"]) {
      expect(
        screen
          .getByRole("checkbox", { name })
          .closest("label")
          ?.querySelector("svg")
      ).not.toBeNull();
    }
  });

  it("uses finite splash motion and hides decorative confetti with reduced motion", () => {
    const css = readFileSync("src/assets/css/fotobooth.module.css", "utf8");
    const splash = readFileSync(
      "src/features/party/experiences/fotobooth/Splash.tsx",
      "utf8"
    );
    expect(css).toMatch(/animation: confettiFall linear 1 both/);
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.confettiContainer\s*\{\s*display: none/
    );
    expect(css).toContain("var(--confetti-drift)");
    expect(css).toContain("var(--confetti-initial-rotation)");
    expect(css).toContain("var(--confetti-rotation)");
    expect(splash).toMatch(
      /className=\{styles.confettiContainer\} aria-hidden="true"/
    );
    expect(splash).toContain("if (!showConfetti) return null");
  });
});
