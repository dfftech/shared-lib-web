// Tests for TypeIcon (lucide-react by name).
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TypeIcon } from "../src/index.ts";

let pressCount = 0;

function countPress(): void {
  pressCount += 1;
}

function testRendersIconByName(): void {
  const { container } = render(<TypeIcon name="Users" size={24} className="text-primary" />);
  const svg = container.querySelector("svg");
  expect(svg).not.toBeNull();
  expect(svg?.getAttribute("width")).toBe("24");
  expect(svg?.getAttribute("class")).toContain("text-primary");
}

function testUnknownNameRendersNothing(): void {
  const { container } = render(<TypeIcon name="NotARealIcon" />);
  expect(container.innerHTML).toBe("");
}

function testClickableIcon(): void {
  pressCount = 0;
  render(<TypeIcon name="Pencil" title="Edit" onPress={countPress} />);
  const button = screen.getByTitle("Edit");
  fireEvent.click(button);
  expect(pressCount).toBe(1);
}

function testDisabledIcon(): void {
  pressCount = 0;
  render(<TypeIcon name="Pencil" title="Edit" onPress={countPress} disabled />);
  const button = screen.getByTitle("Edit");
  fireEvent.click(button);
  expect(pressCount).toBe(0);
  expect(button.className).toContain("opacity-40");
}

describe("TypeIcon", function describeTypeIcon() {
  afterEach(cleanup);
  it("renders a lucide icon by name", testRendersIconByName);
  it("renders nothing for an unknown name", testUnknownNameRendersNothing);
  it("becomes a button with onPress", testClickableIcon);
  it("ignores clicks when disabled", testDisabledIcon);
});
