import { describe, expect, it } from "vitest";
import { certificateEligible, quizPassed, saleCommission } from "./mock-rules";
describe("isolated mock learning rules", () => {
  it("requires completed lessons and passed assessment for certificate", () => {
    expect(certificateEligible([0, 1], true)).toBe(false);
    expect(certificateEligible([0, 1, 2], false)).toBe(false);
    expect(certificateEligible([0, 1, 2], true)).toBe(true);
  });
  it("checks submitted answers", () => {
    expect(quizPassed([0, 1, 0], [0, 1, 0])).toBe(true);
    expect(quizPassed([1, 1, 0], [0, 1, 0])).toBe(false);
  });
  it("never rewards signups, only verified sales", () => {
    expect(saleCommission("signup", true, 200)).toBe(0);
    expect(saleCommission("sale", false, 200)).toBe(0);
    expect(saleCommission("sale", true, 200)).toBe(200);
  });
});