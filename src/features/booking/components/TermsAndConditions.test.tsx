// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TermsAndConditions from "./TermsAndConditions";
import {
  ReservationTracker,
  setActiveReservationTracker,
} from "../tracking/reservationTracker";

describe("TermsAndConditions", () => {
  it("reports the word count and the reached end to the tracker", () => {
    const setTermsProgress = vi.fn();
    setActiveReservationTracker({ setTermsProgress } as unknown as ReservationTracker);

    render(
      <TermsAndConditions
        globalTerms={[{ id: 1, title: "Pagos", content: "<p>uno dos tres</p>" } as never]}
        brandTerms={[]}
        packageTerms={[]}
      />,
    );

    expect(setTermsProgress).toHaveBeenLastCalledWith({
      maxScrollPct: 100,
      reachedEnd: true,
      wordCount: 4,
    });
    setActiveReservationTracker(null);
  });
});
