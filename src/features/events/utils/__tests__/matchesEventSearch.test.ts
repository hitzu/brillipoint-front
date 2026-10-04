import { describe, expect, it } from "vitest";
import { matchesEventSearch } from "../matchesEventSearch";

const event = { honoreesNames: "Ana y Luis", key: "BODA-2026-AL", token: "Xy7kQp9" };

describe("matchesEventSearch", () => {
  it.each(["ana", "LUIS", "boda-2026", "2026-al", "xy7k", "QP9"])("matches %j by name, key or token", (term) => {
    expect(matchesEventSearch(event, term)).toBe(true);
  });

  it("does not match unrelated terms", () => {
    expect(matchesEventSearch(event, "xv")).toBe(false);
  });

  it("tolerates events without name, key or token", () => {
    expect(matchesEventSearch({ honoreesNames: null, key: undefined, token: null } as any, "ana")).toBe(false);
  });
});
