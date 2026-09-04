import { describe, expect, it } from "vitest";
import { ACCEPTED_NOTICE_FILES, isImageFile } from "@/lib/extract-file";

describe("extract-file helpers", () => {
  it("accepts common notice file types in the picker string", () => {
    expect(ACCEPTED_NOTICE_FILES).toMatch(/\.pdf/);
    expect(ACCEPTED_NOTICE_FILES).toMatch(/\.txt/);
    expect(ACCEPTED_NOTICE_FILES).toMatch(/image\/jpeg|\.jpe?g/);
  });

  it("detects image files by mime or extension", () => {
    expect(isImageFile(new File([], "bill.png", { type: "image/png" }))).toBe(true);
    expect(isImageFile(new File([], "scan.JPG", { type: "" }))).toBe(true);
    expect(isImageFile(new File([], "notice.pdf", { type: "application/pdf" }))).toBe(false);
  });
});
