// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgendaSummary } from "./AgendaSummary";

describe("AgendaSummary", () => {
  it("does not render the raw ISO date under the weekday heading", () => {
    render(
      <AgendaSummary
        entries={{}}
        selectedDate="2026-09-14"
        onDateSelect={() => undefined}
      />
    );

    expect(screen.queryByText("2026-09-14")).toBeNull();
  });

  it("keeps the weekday + day-number heading buttons", () => {
    render(
      <AgendaSummary
        entries={{}}
        selectedDate="2026-09-14"
        onDateSelect={() => undefined}
      />
    );

    expect(screen.getByText("Lun")).toBeTruthy();
    expect(screen.getByText("14")).toBeTruthy();
  });

  it("keeps the selected-day highlight on the matching column", () => {
    const { container } = render(
      <AgendaSummary
        entries={{}}
        selectedDate="2026-09-14"
        onDateSelect={() => undefined}
      />
    );

    const selected = container.querySelector("article.is-selected");
    expect(selected?.getAttribute("aria-label")).toBe("2026-09-14");
  });
});
