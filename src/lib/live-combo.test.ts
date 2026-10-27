import { describe, expect, it } from "vitest";
import { liveClassCombo } from "./courses";

describe("live class combo", () => {
  it("uses YouTube for broadcasts", () => {
    expect(liveClassCombo.broadcast.provider).toBe("youtube");
  });
  it("uses Jitsi for interactive doubts", () => {
    expect(liveClassCombo.doubts.provider).toBe("jitsi");
  });
  it("keeps both services disconnected during client testing", () => {
    expect(liveClassCombo.broadcast.mode).toBe("preview");
    expect(liveClassCombo.doubts.mode).toBe("preview");
  });
});