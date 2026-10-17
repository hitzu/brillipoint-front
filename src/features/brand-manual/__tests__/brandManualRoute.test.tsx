// @vitest-environment jsdom
import type { ComponentType } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// authGuard.js has JSX in a .js file, which Vite doesn't parse, so it is replaced
// by a marker wrapper: the route only has to be wrapped by it.
vi.mock("../../../middleware/authGuard", () => ({
  default:
    (Wrapped: ComponentType<Record<string, unknown>>) =>
    (props: Record<string, unknown>) => (
      <div data-testid="auth-guard">
        <Wrapped {...props} />
      </div>
    ),
}));
vi.mock("@layout/index", () => ({ default: () => <div data-testid="admin-layout" /> }));
vi.mock("../pages/BrandManualPage", () => ({ BrandManualPage: () => <p>manual</p> }));

import BrandManualRoute from "../../../pages/brand-manual";

describe("/brand-manual route", () => {
  it("renders full screen, without the admin layout, behind the session guard", () => {
    render(BrandManualRoute.getLayout(<BrandManualRoute />));
    expect(screen.queryByTestId("admin-layout")).toBeNull();
    expect(screen.getByTestId("auth-guard").textContent).toBe("manual");
  });
});
