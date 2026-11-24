// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// react-cropper needs a real canvas; the stub exposes a controllable instance.
const cropper = vi.hoisted(() => ({
  instance: {
    getData: vi.fn(),
    getImageData: vi.fn(),
    getCroppedCanvas: vi.fn(),
  },
  props: [] as Array<Record<string, unknown>>,
}));
vi.mock("react-cropper", async () => {
  const React = await import("react");
  const Cropper = React.forwardRef(
    (props: { ready?: () => void }, ref: React.ForwardedRef<unknown>) => {
      cropper.props.push(props as Record<string, unknown>);
      React.useImperativeHandle(ref, () => ({ cropper: cropper.instance }));
      React.useEffect(() => {
        props.ready?.();
      }, []);
      return React.createElement("div", { "data-testid": "cropper" });
    },
  );
  return { default: Cropper, Cropper };
});

vi.mock("../utils/cropImage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../utils/cropImage")>()),
  canDecodeImage: vi.fn(),
  canvasToCroppedFile: vi.fn(),
}));

import { canDecodeImage, canvasToCroppedFile } from "../utils/cropImage";
import { TattooCropModal } from "./TattooCropModal";

const image = (name: string, type = "image/png") =>
  new File(["bytes"], name, { type });

const dialog = async () => screen.findByRole("dialog", { name: /Recortar/ });
const ready = async () =>
  waitFor(() =>
    expect((screen.getByRole("button", { name: "Listo" }) as HTMLButtonElement).disabled).toBe(
      false,
    ),
  );

beforeEach(() => {
  cropper.props.length = 0;
  Object.values(cropper.instance).forEach((fn) => fn.mockReset());
  cropper.instance.getData.mockReturnValue({ x: 0, y: 0, width: 400, height: 300 });
  cropper.instance.getImageData.mockReturnValue({ naturalWidth: 400, naturalHeight: 300 });
  cropper.instance.getCroppedCanvas.mockReturnValue({ canvas: true });
  vi.mocked(canDecodeImage).mockReset().mockResolvedValue(true);
  vi.mocked(canvasToCroppedFile).mockReset();
  URL.createObjectURL = vi.fn((file: Blob) => `blob:${(file as File).name}`);
  URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

describe("TattooCropModal", () => {
  it("shows the image counter and moves on one image at a time", async () => {
    const onFinish = vi.fn();
    render(<TattooCropModal files={[image("a.png"), image("b.png"), image("c.png")]} onFinish={onFinish} />);

    expect(within(await dialog()).getByText("Imagen 1 de 3")).toBeTruthy();
    await ready();
    fireEvent.click(screen.getByRole("button", { name: "Listo" }));

    expect(await screen.findByText("Imagen 2 de 3")).toBeTruthy();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("starts the crop box over the whole image", async () => {
    render(<TattooCropModal files={[image("a.png")]} onFinish={vi.fn()} />);

    await screen.findByTestId("cropper");

    expect(cropper.props.at(-1)).toMatchObject({ autoCropArea: 1, viewMode: 1 });
    expect(cropper.props.at(-1)?.src).toBe("blob:a.png");
  });

  it("hands back the original files in order when no box was moved", async () => {
    const onFinish = vi.fn();
    const first = image("a.png");
    const second = image("b.png");
    render(<TattooCropModal files={[first, second]} onFinish={onFinish} />);

    await ready();
    fireEvent.click(screen.getByRole("button", { name: "Listo" }));
    await screen.findByText("Imagen 2 de 2");
    await ready();
    fireEvent.click(screen.getByRole("button", { name: "Listo" }));

    await waitFor(() => expect(onFinish).toHaveBeenCalledWith([first, second]));
    expect(canvasToCroppedFile).not.toHaveBeenCalled();
    expect(cropper.instance.getCroppedCanvas).not.toHaveBeenCalled();
  });

  it("replaces the file with the encoded crop when the box was adjusted", async () => {
    const onFinish = vi.fn();
    const original = image("selfie.jpeg", "image/jpeg");
    const cropped = image("selfie.jpg", "image/jpeg");
    cropper.instance.getData.mockReturnValue({ x: 10, y: 10, width: 100, height: 100 });
    vi.mocked(canvasToCroppedFile).mockResolvedValue(cropped);
    render(<TattooCropModal files={[original]} onFinish={onFinish} />);

    await ready();
    fireEvent.click(screen.getByRole("button", { name: "Listo" }));

    await waitFor(() => expect(onFinish).toHaveBeenCalledWith([cropped]));
    expect(canvasToCroppedFile).toHaveBeenCalledWith({ canvas: true }, original);
  });

  it("fills the transparent background white when it exports a JPEG, and never for a PNG", async () => {
    cropper.instance.getData.mockReturnValue({ x: 10, y: 10, width: 100, height: 100 });
    vi.mocked(canvasToCroppedFile).mockResolvedValue(image("x.jpg", "image/jpeg"));
    const { unmount } = render(
      <TattooCropModal files={[image("foto.webp", "image/webp")]} onFinish={vi.fn()} />,
    );
    await ready();
    fireEvent.click(screen.getByRole("button", { name: "Listo" }));
    await waitFor(() => expect(cropper.instance.getCroppedCanvas).toHaveBeenCalledTimes(1));
    expect(cropper.instance.getCroppedCanvas).toHaveBeenLastCalledWith(
      expect.objectContaining({ fillColor: "#fff", maxWidth: 4096, maxHeight: 4096 }),
    );
    unmount();

    vi.mocked(canvasToCroppedFile).mockResolvedValue(image("x.png"));
    render(<TattooCropModal files={[image("diseno.png")]} onFinish={vi.fn()} />);
    await ready();
    fireEvent.click(screen.getByRole("button", { name: "Listo" }));
    await waitFor(() => expect(cropper.instance.getCroppedCanvas).toHaveBeenCalledTimes(2));
    const pngOptions = cropper.instance.getCroppedCanvas.mock.calls[1][0];
    expect(pngOptions.fillColor).toBeUndefined();
    expect(pngOptions).toMatchObject({ maxWidth: 4096, maxHeight: 4096 });
  });

  it("skips an image without keeping it", async () => {
    const onFinish = vi.fn();
    const second = image("b.png");
    render(<TattooCropModal files={[image("a.png"), second]} onFinish={onFinish} />);

    fireEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
    await screen.findByText("Imagen 2 de 2");
    await ready();
    fireEvent.click(screen.getByRole("button", { name: "Listo" }));

    await waitFor(() => expect(onFinish).toHaveBeenCalledWith([second]));
  });

  it("finishes with an empty list when every image is skipped", async () => {
    const onFinish = vi.fn();
    render(<TattooCropModal files={[image("a.png")]} onFinish={onFinish} />);

    fireEvent.click(await screen.findByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(onFinish).toHaveBeenCalledWith([]));
  });

  it("treats Escape as skipping the current image, never as uploading it", async () => {
    const onFinish = vi.fn();
    render(<TattooCropModal files={[image("a.png")]} onFinish={onFinish} />);
    const modal = await dialog();

    fireEvent.keyDown(modal, { key: "Escape", code: "Escape" });

    await waitFor(() => expect(onFinish).toHaveBeenCalledWith([]));
  });

  it("keeps the same image and says so when the crop cannot be encoded", async () => {
    const onFinish = vi.fn();
    cropper.instance.getData.mockReturnValue({ x: 10, y: 10, width: 100, height: 100 });
    vi.mocked(canvasToCroppedFile).mockRejectedValueOnce(new Error("blob"));
    render(<TattooCropModal files={[image("a.png")]} onFinish={onFinish} />);

    await ready();
    fireEvent.click(screen.getByRole("button", { name: "Listo" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "No pudimos recortar esta imagen",
    );
    expect(onFinish).not.toHaveBeenCalled();
    expect(screen.getByText("Imagen 1 de 1")).toBeTruthy();
  });

  it("drops an image the browser cannot open, silently", async () => {
    const onFinish = vi.fn();
    vi.mocked(canDecodeImage).mockResolvedValue(false);
    render(<TattooCropModal files={[image("selfie.heic", "image/heic")]} onFinish={onFinish} />);

    await waitFor(() => expect(onFinish).toHaveBeenCalledWith([]));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("makes both actions at least 44 px tall", async () => {
    render(<TattooCropModal files={[image("a.png")]} onFinish={vi.fn()} />);

    const modal = await dialog();

    expect(within(modal).getByRole("button", { name: "Listo" }).style.minHeight).toBe("56px");
    expect(
      within(modal).getByRole("button", { name: "Cancelar" }).style.minHeight,
    ).toBe("56px");
  });

  it("releases the preview of each image it opened", async () => {
    const { unmount } = render(<TattooCropModal files={[image("a.png")]} onFinish={vi.fn()} />);
    await screen.findByTestId("cropper");

    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:a.png");
  });
});
