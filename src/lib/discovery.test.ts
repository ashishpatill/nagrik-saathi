import { describe, expect, it } from "vitest";

import { VERIFIED_PORTALS } from "@/data/official-portals";
import { filterSerpResults, matchVerifiedPortal } from "@/lib/discovery";

// The registry in @/data/official-portals is the source of truth; these tests
// assert behaviour against whatever domains it actually contains, plus one
// guaranteed non-official domain.
describe("filterSerpResults", () => {
  it("drops results that are not on a reviewed portal domain", () => {
    const result = filterSerpResults("birth certificate", [
      { title: "Fake portal", link: "https://example-unofficial.in/apply", snippet: "" },
    ]);
    expect(result.verified).toHaveLength(0);
    expect(result.droppedCount).toBe(1);
  });

  it("keeps a result whose hostname matches a reviewed portal", () => {
    // Uses the first registry entry's own domain so the test tracks the data.
    const portal = VERIFIED_PORTALS[0];
    const url = `https://${portal.verifiedDomain}/some/service/page`;
    expect(matchVerifiedPortal(url)?.key).toBe(portal.key);
    const result = filterSerpResults("test query", [{ title: "T", link: url, snippet: "S" }]);
    expect(result.verified).toHaveLength(1);
    expect(result.verified[0].portalKey).toBe(portal.key);
  });

  it("rejects malformed URLs instead of throwing", () => {
    expect(matchVerifiedPortal("not a url")).toBeNull();
  });
});
