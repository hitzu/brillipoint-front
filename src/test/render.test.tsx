// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("React test environment", () => {
  it("renders JSX with the automatic React runtime", () => {
    render(<button type="button">Test action</button>);
    expect(screen.getByRole("button", { name: "Test action" })).toBeTruthy();
  });

  it("cleans up the rendered DOM between tests", () => {
    expect(screen.queryByRole("button", { name: "Test action" })).toBeNull();
  });
});
