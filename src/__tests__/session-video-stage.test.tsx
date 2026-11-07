// @vitest-environment jsdom
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ItemStage from "../features/party/experiences/fotobooth/Carousel/ui/ItemStage";
import type { SessionItem } from "../features/party/types/session";

const photo: SessionItem = {
  type: "photo",
  src: "https://cdn.test/a-min.jpg",
  originalSrc: "https://cdn.test/a.jpg",
  alt: "Foto 1",
  index: 0,
};
const video: SessionItem = {
  type: "video",
  src: "https://cdn.test/v.mp4",
  originalSrc: "https://cdn.test/v.mp4",
  posterSrc: "https://cdn.test/v.jpg",
  alt: "Video",
  index: 1,
};

const renderStage = (activeIndex: number, handlers: Partial<{ onItemLoad: () => void }> = {}) =>
  render(
    <ItemStage
      activeEffect="hearts"
      activeIndex={activeIndex}
      canNavigate
      itemState={{ status: "loaded", retryCount: 0 }}
      items={[photo, video]}
      onGoTo={vi.fn()}
      onItemError={vi.fn()}
      onItemLoad={handlers.onItemLoad ?? vi.fn()}
      onPointerEnd={vi.fn()}
      onPointerStart={vi.fn()}
      onRetry={vi.fn()}
    />,
  );

describe("ItemStage with a video item", () => {
  it("renders the active video as a muted looping inline clip with its poster", () => {
    const { container } = renderStage(1);

    const el = container.querySelector("video");
    expect({
      src: el?.getAttribute("src"),
      poster: el?.getAttribute("poster"),
      muted: el?.muted,
      loop: el?.loop,
      playsInline: el?.hasAttribute("playsinline"),
    }).toEqual({
      src: "https://cdn.test/v.mp4",
      poster: "https://cdn.test/v.jpg",
      muted: true,
      loop: true,
      playsInline: true,
    });
  });

  it("does not load the video while another slide is active", () => {
    const { container } = renderStage(0);

    expect(container.querySelector("video")).toBeNull();
  });

  it("keeps rendering photos as images", () => {
    const { container } = renderStage(0);

    expect(container.querySelector("img")?.getAttribute("src")).toBe("https://cdn.test/a-min.jpg");
  });

  it("reports the item as loaded once the video data is ready", () => {
    const onItemLoad = vi.fn();
    const { container } = renderStage(1, { onItemLoad });

    fireEvent.loadedData(container.querySelector("video")!);

    expect(onItemLoad).toHaveBeenCalledWith(1);
  });

  it("does not draw the confetti/hearts overlay over a video", () => {
    const { container } = renderStage(1);

    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});
