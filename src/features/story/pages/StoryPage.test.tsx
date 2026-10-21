// @vitest-environment jsdom
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/head", () => ({ default: () => null }));

const expectPublicFile = (src: string | null) => {
  expect(src?.startsWith("/story/")).toBe(true);
  expect(existsSync(resolve(__dirname, "../../../../public", (src ?? "").slice(1)))).toBe(true);
};

import { StoryPage } from "./StoryPage";
import Story from "../../../pages/story";

describe("StoryPage", () => {
  it("renders the build log title and the main sections", () => {
    render(<StoryPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Brillipoint — how a photobooth became a product",
      }),
    ).toBeTruthy();
    for (const name of [
      "In one line",
      "Why a photobooth and not another SaaS",
      "v0 — the iPad we already had",
      "v1 — a real enclosure",
      "The flow guests actually see",
      "Galleries 100% configurable, adapted to each event's theme",
      "Built to work with no internet",
      "Turning the most emotional moment into a sales channel",
      "The loop I work in",
      "The SaaS behind the booth",
      "How I build it",
      "Where it's going",
      "Roadmap",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name })).toBeTruthy();
    }
  });

  it("describes both diagrams for screen readers", () => {
    render(<StoryPage />);

    expect(screen.getByRole("img", { name: /four surfaces read one theme/i })).toBeTruthy();
    expect(screen.getByRole("img", { name: /photo never waits for the network/i })).toBeTruthy();
  });

  it("only references images that exist in public/story with alt text", () => {
    const { container } = render(<StoryPage />);
    const images = Array.from(container.querySelectorAll("img"));

    expect(images.length).toBeGreaterThan(0);
    for (const img of images) {
      expectPublicFile(img.getAttribute("src"));
      expect(img.getAttribute("alt")).toBeTruthy();
    }
  });

  it("plays real footage as muted inline loops with a poster and a label", () => {
    const { container } = render(<StoryPage />);
    const videos = Array.from(container.querySelectorAll("video"));

    expect(videos.length).toBe(5);
    for (const video of videos) {
      expectPublicFile(video.getAttribute("src"));
      expectPublicFile(video.getAttribute("poster"));
      expect(video.muted).toBe(true);
      expect(video.loop).toBe(true);
      expect(video.hasAttribute("playsinline")).toBe(true);
      expect(video.getAttribute("aria-label")).toBeTruthy();
    }
  });

  it("follows one event end to end and keeps the other themes in the configurable section", () => {
    render(<StoryPage />);

    expect(screen.queryByRole("heading", { level: 2, name: "What's under the hood" })).toBeNull();
    const flow = screen.getByRole("region", { name: "The flow guests actually see" });
    const flowVideos = within(flow)
      .getAllByLabelText(/.+/, { selector: "video" })
      .map((video) => video.getAttribute("src"));
    expect(flowVideos).toEqual([
      "/story/booth-in-use.mp4",
      "/story/booth-result.mp4",
      "/story/gallery-babyshower.mp4",
    ]);
    expect(within(flow).getByText(/same theme as the event/i)).toBeTruthy();

    const themes = screen.getByRole("region", {
      name: "Galleries 100% configurable, adapted to each event's theme",
    });
    expect(themes.querySelector('video[src="/story/gallery-quince.mp4"]')).toBeTruthy();
    expect(themes.querySelector('img[src="/story/gallery-wedding.jpg"]')).toBeTruthy();
    expect(within(themes).getByRole("img", { name: /four surfaces read one theme/i })).toBeTruthy();
  });

  it("shows real screenshots and photos in the keepsakes and SaaS carousels", () => {
    render(<StoryPage />);

    const carousels: Record<string, string[]> = {
      "Prints and keepsakes": ["Print server", "Template system", "Polaroid photos", "Minibook"],
      "The SaaS behind the booth": ["Agenda", "Contracts", "Client booking page", "Brand manual"],
    };
    for (const [section, labels] of Object.entries(carousels)) {
      const region = screen.getByRole("region", { name: section });
      const slides = within(region).getByRole("list", { name: `${section} carousel` });
      const items = within(slides).getAllByRole("listitem");
      expect(items.map((item) => item.querySelector("h3")?.textContent)).toEqual(labels);
      for (const item of items) expect(item.querySelector("img")).toBeTruthy();
    }
    expect(screen.queryByText("Booth result screen")).toBeNull();
  });

  it("opens any photo full size in a modal and closes it with Escape or the close button", () => {
    render(<StoryPage />);

    fireEvent.click(screen.getByRole("button", { name: /view larger: print server dashboard/i }));
    const dialog = screen.getByRole("dialog", { name: /print server dashboard/i });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(within(dialog).getByRole("img").getAttribute("src")).toBe("/story/print-server.jpg");
    expect(document.activeElement).toBe(within(dialog).getByRole("button", { name: "Close" }));

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /view larger: first version/i }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("explains that owning the print design lets us experiment with formats", () => {
    render(<StoryPage />);

    const keepsakes = screen.getByRole("region", { name: "Prints and keepsakes" });
    expect(keepsakes.textContent).toMatch(/total control over the design/i);
    expect(keepsakes.textContent).toMatch(/keychains, polaroids, minichicks, minibooks/i);
  });

  it("names Brillipoint only once in the hero", () => {
    const { container } = render(<StoryPage />);

    const hero = container.querySelector("header");
    expect(hero?.textContent?.match(/Brillipoint/g)).toHaveLength(1);
    expect(hero?.textContent).toMatch(/This is the business I run on the side/);
  });

  it("backs the gallery as a sales page with the share of guests who come back", () => {
    render(<StoryPage />);

    const heading = screen.getByRole("heading", {
      level: 2,
      name: "Turning the most emotional moment into a sales channel",
    });
    expect(heading.closest("section")?.textContent).toMatch(
      /about 40% of guests open their photos after the event/i,
    );
  });

  it("tells how the business taught us sales funnels", () => {
    render(<StoryPage />);

    expect(document.body.textContent).toMatch(/sales funnels/i);
  });

  it("gives other operators their own section and prints over a mobile hotspot", () => {
    render(<StoryPage />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "The product we didn't plan: galleries for other operators",
      }),
    ).toBeTruthy();
    expect(document.body.textContent).toMatch(/mobile hotspot/i);
    expect(document.body.textContent).not.toMatch(/venue wi-fi/i);
    expect(screen.queryByRole("link", { name: /get in touch/i })).toBeNull();
  });

  it("splits the roadmap into product and tech issues linked to the public backlog", () => {
    render(<StoryPage />);

    expect(screen.getByRole("heading", { level: 3, name: "Product" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: "Tech" })).toBeTruthy();
    const breaker = screen.getByRole("link", { name: /#6/ });
    expect(breaker.getAttribute("href")).toBe("https://github.com/hitzu/brillipoint-ops/issues/6");
    const backlog = screen.getByRole("link", { name: /all open issues/i });
    expect(backlog.getAttribute("href")).toBe("https://github.com/hitzu/brillipoint-ops/issues");
  });

  it("separates the AI workflow I run today from the agent loop that comes next", () => {
    render(<StoryPage />);

    const build = screen.getByRole("region", { name: "How I build it" });
    const today = within(build).getByRole("list", { name: "Today" });
    expect(within(today).getAllByRole("listitem").map((item) => item.querySelector("h3")?.textContent)).toEqual([
      "Plan",
      "Tasks",
      "Tests first",
      "Code",
      "Automated QA",
      "My review",
      "Release",
    ]);
    expect(within(build).getByRole("img", { name: /issue moves through five states/i })).toBeTruthy();
    expect(within(build).getByText(/documentation is still the weak step/i)).toBeTruthy();
    expect(within(build).getByRole("link", { name: /full design/i }).getAttribute("href")).toBe(
      "https://github.com/hitzu/brillipoint-ops/blob/main/plan.md",
    );
  });

  it("is a public route outside the authenticated layout", () => {
    expect(typeof Story.getLayout).toBe("function");
  });
});
