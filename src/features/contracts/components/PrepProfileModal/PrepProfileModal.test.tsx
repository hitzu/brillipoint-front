// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const service = vi.hoisted(() => ({ getStaffPrepProfile: vi.fn() }));
vi.mock("../../../../api/services/prepProfileService", () => service);

import { PrepProfileModal } from "./PrepProfileModal";

beforeEach(() => {
  service.getStaffPrepProfile.mockReset();
});
afterEach(cleanup);

describe("PrepProfileModal", () => {
  it("loads the answers of the contract when opened", async () => {
    service.getStaffPrepProfile.mockResolvedValue({
      contractId: 7,
      answers: { makeup_idea: "Look natural" },
      locked: {},
    });

    render(<PrepProfileModal show contractId={7} handleClose={() => {}} />);

    await waitFor(() => expect(screen.getByText("Look natural")).toBeTruthy());
    expect(service.getStaffPrepProfile).toHaveBeenCalledWith(7);
  });

  it("does not fetch while closed", () => {
    render(<PrepProfileModal show={false} contractId={7} handleClose={() => {}} />);

    expect(service.getStaffPrepProfile).not.toHaveBeenCalled();
  });

  it("shows an error when the answers cannot be loaded", async () => {
    service.getStaffPrepProfile.mockRejectedValue(new Error("500"));

    render(<PrepProfileModal show contractId={7} handleClose={() => {}} />);

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "No se pudieron cargar las respuestas",
      ),
    );
  });
});
