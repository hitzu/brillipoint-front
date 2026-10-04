import { describe, expect, it } from "vitest";
import { matchesEventSearch } from "../matchesEventSearch";

const event = { honoreesNames: "Ana y Luis", key: "BODA-2026-AL" };

describe("matchesEventSearch", () => {
  it.each(["ana", "LUIS", "boda-2026", "2026-al"])("matches %j by name or key", (term) => {
    expect(matchesEventSearch(event, term)).toBe(true);
  });

  it("does not match unrelated terms", () => {
    expect(matchesEventSearch(event, "xv")).toBe(false);
  });

  it("tolerates events without name or key", () => {
    expect(matchesEventSearch({ honoreesNames: null, key: undefined } as any, "ana")).toBe(false);
  });
});
