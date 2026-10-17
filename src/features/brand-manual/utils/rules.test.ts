import { describe, expect, it } from "vitest";
import {
  VOICE_BAD_SAMPLE,
  VOICE_GOOD_SAMPLE,
  fitVerdict,
  logoVerdict,
  reviewCopy,
  sparkVerdict,
  typeVerdict,
} from "./rules";

describe("logoVerdict", () => {
  it("rejects the white logo on a light background", () => {
    expect(logoVerdict({ version: "neon", background: "ivory", size: 200 }).kind).toBe("no");
  });

  it("rejects the black logo on a dark background", () => {
    expect(logoVerdict({ version: "black", background: "black", size: 200 }).kind).toBe("no");
  });

  it("approves the neon logo on black at a large size", () => {
    expect(logoVerdict({ version: "neon", background: "black", size: 200 }).kind).toBe("ok");
  });

  it("rejects the glow below 160 px", () => {
    const verdict = logoVerdict({ version: "neon", background: "black", size: 120 });
    expect(verdict.kind).toBe("no");
    expect(verdict.message).toMatch(/160 px/);
  });

  it("rejects any logo below 64 px because the arc can't be read", () => {
    expect(logoVerdict({ version: "black", background: "white", size: 48 }).message).toMatch(/48 px/);
  });

  it("warns that the black logo carries a shadow and can't go to print", () => {
    expect(logoVerdict({ version: "black", background: "white", size: 200 }).kind).toBe("warn");
  });

  it("flags the script signature as reference only", () => {
    expect(logoVerdict({ version: "signatureBlack", background: "ivory", size: 200 }).kind).toBe("warn");
  });
});

describe("fitVerdict", () => {
  it("rejects gold-500 text on a light surface", () => {
    const result = fitVerdict("surface-100", "gold-500", "light");
    expect(result.ratio).toBeCloseTo(1.8, 1);
    expect(result.verdict.kind).toBe("no");
    expect(result.verdict.message).toMatch(/gold-700/);
  });

  it("approves gold-500 text on the night surface", () => {
    expect(fitVerdict("surface-100", "gold-500", "dark").verdict.kind).toBe("ok");
  });

  it("never allows white on gold", () => {
    expect(fitVerdict("gold-500", "neon", "light").verdict.message).toMatch(/Nunca blanco sobre dorado/);
  });

  it("never allows gold-700 on gold-100", () => {
    expect(fitVerdict("gold-100", "gold-700", "light").verdict.kind).toBe("no");
  });

  it("warns that pure white belongs to the neon sign", () => {
    expect(fitVerdict("surface-100", "neon", "dark").verdict.kind).toBe("warn");
  });

  it("approves ink on the page background", () => {
    expect(fitVerdict("surface-100", "ink", "light").verdict.kind).toBe("ok");
  });
});

describe("typeVerdict", () => {
  it("asks for a phrase when the input is empty", () => {
    expect(typeVerdict("display", "   ").kind).toBe("warn");
  });

  it("rejects the script in uppercase", () => {
    expect(typeVerdict("script-l", "UN RECUERDO").kind).toBe("no");
  });

  it("warns when the script accent is longer than a short phrase", () => {
    expect(typeVerdict("script-l", "un recuerdo que sí se queda para siempre jamás").kind).toBe("warn");
  });

  it("warns when a title is longer than two lines", () => {
    expect(typeVerdict("display", "Momentos hoy, recuerdos siempre y para toda la vida").kind).toBe("warn");
  });

  it("rejects a price with desde or a discount", () => {
    expect(typeVerdict("price", "desde $3,200").kind).toBe("no");
    expect(typeVerdict("price", "$3,200 por evento").kind).toBe("ok");
  });
});

describe("sparkVerdict", () => {
  it("approves up to five sparks", () => {
    expect(sparkVerdict(1).message).toMatch(/^1 destello,/);
    expect(sparkVerdict(5).kind).toBe("ok");
  });

  it("rejects more than five sparks", () => {
    expect(sparkVerdict(6).kind).toBe("no");
  });
});

describe("reviewCopy", () => {
  it("reports an empty text", () => {
    expect(reviewCopy("  ").status).toBe("empty");
  });

  it("flags every off-brand pattern in the bad sample, in rule order", () => {
    const result = reviewCopy(VOICE_BAD_SAMPLE);
    expect(result.status).toBe("flags");
    expect(result.flags.map((flag) => flag.match)).toEqual([
      "¡¡ · !!",
      "APARTA YA",
      "barata",
      "Cabina",
      "desde",
      "🎉",
      "APARTA",
    ]);
  });

  it("lets brand words stay in uppercase", () => {
    expect(reviewCopy("Agenda tu fecha con PHOTOBOOTH y GLITTER BAR.").status).toBe("ok");
  });

  it("passes the good sample", () => {
    expect(reviewCopy(VOICE_GOOD_SAMPLE)).toEqual({ status: "ok", flags: [] });
  });
});
