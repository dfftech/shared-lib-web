// Tests for TypeImage / TypeVideo: skeleton until the file loads, error icon, and the preview popup
// (full image, or the video playing with controls).
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { SharedWebUiProvider, TypeImage, TypeVideo, buildMediaStyle, closeMediaPreview, mediaPreviewSignal } from "../src/index.ts";
import { testConfig } from "./test-config.ts";

function MediaPage() {
  return (
    <SharedWebUiProvider config={testConfig}>
      <p>media page</p>
      <TypeImage src="/photo.jpg" previewSrc="/photo-small.jpg" alt="Sky photo" />
      <TypeVideo src="/demo.mp4" poster="/poster.jpg" title="Demo video" />
      <TypeImage src="/still.jpg" alt="Still photo" isPreviewable={false} />
    </SharedWebUiProvider>
  );
}

function closePreview(): void {
  closeMediaPreview();
}

async function testImageSkeletonAndPopup(): Promise<void> {
  render(<MediaPage />);
  await screen.findByText("media page");
  const imageButton = screen.getByRole("button", { name: "Open preview: Sky photo" });
  const thumbnail = within(imageButton).getByRole("img", { name: "Sky photo" });
  expect(thumbnail.getAttribute("src")).toBe("/photo-small.jpg");
  const skeleton = imageButton.querySelector(".skeleton");
  expect(skeleton).not.toBeNull();
  expect(thumbnail.getAttribute("data-loaded")).toBeNull();
  fireEvent.load(thumbnail);
  expect(thumbnail.getAttribute("data-loaded")).toBe("true");
  fireEvent.click(imageButton);
  const dialog = screen.getByRole("dialog", { name: "Sky photo" });
  const fullImage = within(dialog).getByRole("img", { name: "Sky photo" });
  expect(fullImage.getAttribute("src")).toBe("/photo.jpg");
  expect(dialog.querySelector(".skeleton")).not.toBeNull();
  act(closePreview);
  expect(screen.queryByRole("dialog")).toBeNull();
}

async function testVideoPlaysInPopup(): Promise<void> {
  render(<MediaPage />);
  await screen.findByText("media page");
  const videoButton = screen.getByRole("button", { name: "Play video: Demo video" });
  fireEvent.click(videoButton);
  expect(mediaPreviewSignal.value.type).toBe("video");
  const dialog = screen.getByRole("dialog", { name: "Demo video" });
  const video = dialog.querySelector("video");
  expect(video).not.toBeNull();
  expect(video?.getAttribute("src")).toBe("/demo.mp4");
  expect(video?.hasAttribute("controls")).toBe(true);
  expect(video?.autoplay).toBe(true);
  act(closePreview);
}

async function testErrorAndNoPreview(): Promise<void> {
  render(<MediaPage />);
  await screen.findByText("media page");
  const still = screen.getByRole("img", { name: "Still photo" });
  expect(still.closest("button")).toBeNull();
  fireEvent.error(still);
  expect(still.getAttribute("data-error")).toBe("true");
}

async function testDynamicSize(): Promise<void> {
  render(
    <SharedWebUiProvider config={testConfig}>
      <p>size page</p>
      <TypeImage src="/a.jpg" alt="Wide" width={240} height={160} />
      <TypeImage src="/b.jpg" alt="Tall" height="8rem" />
      <TypeVideo src="/c.mp4" title="Clip" width="100%" />
    </SharedWebUiProvider>,
  );
  await screen.findByText("size page");
  const wide = screen.getByRole("button", { name: "Open preview: Wide" });
  expect(wide.style.width).toBe("240px");
  expect(wide.style.height).toBe("160px");
  const tall = screen.getByRole("button", { name: "Open preview: Tall" });
  expect(tall.style.height).toBe("8rem");
  expect(tall.style.width).toBe("auto");
  const clip = screen.getByRole("button", { name: "Play video: Clip" });
  expect(clip.style.width).toBe("100%");
  expect(buildMediaStyle()).toBeUndefined();
}

describe("TypeImage / TypeVideo", function describeMedia() {
  afterEach(cleanup);
  it("shows a skeleton until the image loads and opens the full image", testImageSkeletonAndPopup);
  it("opens the video in the popup with controls and autoplay", testVideoPlaysInPopup);
  it("marks a failed image and can switch the popup off", testErrorAndNoPreview);
  it("takes an optional width and height (px number or CSS size)", testDynamicSize);
});
