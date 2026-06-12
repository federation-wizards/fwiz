import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { analyzeMonolith, collectSourceFiles } from "./analyze.js";
const fixture = join(dirname(fileURLToPath(import.meta.url)), "../fixtures/sample-monolith/src");
describe("migrate-analyzer", () => {
  it("collects source files", () => { expect(collectSourceFiles(fixture).some(f => f.endsWith("CheckoutPage.tsx"))).toBe(true); });
  it("proposes remotes", () => {
    const plan = analyzeMonolith({ rootDir: fixture });
    expect(plan.summary.proposedRemotes).toBe(3);
    expect(plan.remotes.map(r => r.name).sort()).toEqual(["admin", "checkout", "home"]);
    expect(plan.remotes.find(r => r.name === "checkout")?.routes).toEqual(["/checkout", "/checkout/cart"]);
    expect(plan.shared.files).toEqual(expect.arrayContaining(["shared/components/Button.tsx", "shared/utils/format.ts"]));
  });
});
