// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReservationPreviewNotice } from "./ReservationPreviewNotice";

describe("ReservationPreviewNotice", () => {
  it("warns that the contract is only a preview when nothing has been paid", () => {
    render(<ReservationPreviewNotice paidAmount={0} />);

    const notice = screen.getByRole("status");
    expect(notice.textContent).toContain("Vista previa");
  });

  it("renders nothing once there is a payment", () => {
    const { container } = render(<ReservationPreviewNotice paidAmount={500} />);
    expect(container.innerHTML).toBe("");
  });
});
