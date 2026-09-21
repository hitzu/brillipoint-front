import { describe, expect, it } from "vitest";
import { normalizeAgendaDays } from "../normalizeAgenda";

describe("agenda normalization", () => {
  it("keeps paid and hold-status API events in one collection", () => {
    const result = normalizeAgendaDays([
      {
        date: "2026-09-18",
        entries: [
          {
            id: 1,
            status: "hold",
            date: "2026-09-18",
            contractId: 2,
            sku: "SKU-1",
            startsAt: "2026-09-18T15:00:00Z",
            endsAt: "2026-09-18T17:00:00Z",
          },
          {
            id: 2,
            status: "confirmed",
            date: "2026-09-18",
            title: "Montaje",
            startsAt: null,
            endsAt: null,
          },
        ],
      },
    ]);
    expect(result["2026-09-18"]).toHaveLength(2);
    expect(result["2026-09-18"][0].sku).toBe("SKU-1");
  });
});

it("projects a prior-day overnight interval into the requested visible day", () => {
  const result = normalizeAgendaDays([
    {
      date: "2026-09-20",
      entries: [
        {
          id: 3,
          date: "2026-09-20",
          startsAt: "2026-09-21T04:00:00Z",
          endsAt: "2026-09-21T08:00:00Z",
        },
      ],
    },
    { date: "2026-09-21", entries: [] },
  ]);

  expect(result["2026-09-21"]).toHaveLength(1);
  expect(result["2026-09-21"][0].key).toBe("agenda:3");
});
