import { describe, expect, it } from "vitest";
import { isNativeAppEnv } from "./native-app";

describe("phone app detection", () => {
  it("is false in a normal mobile browser", () => {
    expect(isNativeAppEnv({ navigator: { userAgent: "Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile" } })).toBe(false);
  });
  it("is true inside the Capacitor app bridge", () => {
    expect(isNativeAppEnv({ Capacitor: { isNativePlatform: () => true }, navigator: { userAgent: "Mozilla/5.0" } })).toBe(true);
  });
  it("is false when Capacitor reports the web platform", () => {
    expect(isNativeAppEnv({ Capacitor: { isNativePlatform: () => false }, navigator: { userAgent: "Mozilla/5.0" } })).toBe(false);
  });
  it("is true with the app user-agent marker", () => {
    expect(isNativeAppEnv({ navigator: { userAgent: "Mozilla/5.0 wv ChartSikhoApp" } })).toBe(true);
  });
  it("is false during server rendering", () => {
    expect(isNativeAppEnv(undefined)).toBe(false);
  });
});
