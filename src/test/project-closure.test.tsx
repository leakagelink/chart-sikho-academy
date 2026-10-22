import { describe, expect, it } from "vitest";
import { Route } from "@/routes/__root";
import { ClosureNotice } from "@/components/site/ClosureNotice";

describe("Permanent project closure", () => {
  it("replaces the shared app entry and all fallback entries with the closure-only screen", () => {
    expect(Route.options.component).toBe(ClosureNotice);
    expect(Route.options.notFoundComponent).toBe(ClosureNotice);
    expect(Route.options.errorComponent).toBe(ClosureNotice);
  });
});