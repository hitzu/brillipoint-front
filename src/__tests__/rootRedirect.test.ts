import { describe, expect, it } from "vitest";

interface Redirect {
  source: string;
  destination: string;
  permanent: boolean;
}

const config = require("../../next.config.js") as {
  redirects: () => Promise<Redirect[]>;
};

describe("staff entry redirect", () => {
  it("temporarily redirects root to agenda without changing legacy redirects", async () => {
    expect(await config.redirects()).toEqual([
      {
        source: "/pages/c/:token",
        destination: "/reserva/:token",
        permanent: true,
      },
      {
        source: "/pages/reserva/:token",
        destination: "/reserva/:token",
        permanent: true,
      },
      {
        source: "/pages/sales",
        destination: "/sales",
        permanent: true,
      },
      {
        source: "/",
        destination: "/agenda",
        permanent: false,
      },
      {
        source: "/contract-list",
        destination: "/contracts",
        permanent: true,
      },
    ]);
  });
});
