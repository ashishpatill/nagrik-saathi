import { webcrypto } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  BACKUP_FORMAT,
  CaseVaultError,
  MAX_BACKUP_BYTES,
  MAX_BACKUP_CASES,
  createCaseBackup,
  readCaseBackup,
} from "@/lib/case-vault";
import { LANGUAGES } from "@/lib/languages";
import type { DocumentAnalysis } from "@/lib/types";

const PASSPHRASE = "correct horse battery staple";

function makeCase(id: string, overrides: Partial<DocumentAnalysis> = {}): DocumentAnalysis {
  return {
    id,
    fileName: "notice.pdf",
    documentType: "property_tax",
    issuer: "Pune Municipal Corporation",
    referenceNumber: `REF-${id}`,
    deadlineDate: "2026-11-30",
    amountDue: 4250,
    urgency: "high",
    scamRiskScore: "safe",
    riskReason: "The notice points to a reviewed portal.",
    summary: Object.fromEntries(
      LANGUAGES.map((language) => [language, `Summary in ${language} for ${id}`]),
    ) as Record<(typeof LANGUAGES)[number], string>,
    requiredActionItems: ["Pay before the deadline"],
    requiredDocuments: ["Property tax bill"],
    officialDepartmentKey: "mahaonline_rts",
    sourceText: `Sensitive source text for ${id}: Aadhaar-like 1234 5678 9012`,
    ...overrides,
  };
}

beforeAll(() => {
  // jsdom provides getRandomValues but not SubtleCrypto. The browser path uses
  // the same WebCrypto API, so Node's implementation is a faithful stand-in.
  vi.stubGlobal("crypto", webcrypto);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

function envelopeOf(file: string): Record<string, unknown> {
  return JSON.parse(file) as Record<string, unknown>;
}

describe("encrypted case backup", () => {
  it("round-trips every saved case without changing the fields", async () => {
    const cases = [makeCase("case-1"), makeCase("case-2", { urgency: "critical" })];

    const file = await createCaseBackup(cases, PASSPHRASE);
    const restored = await readCaseBackup(file, PASSPHRASE);

    expect(restored).toEqual(cases);
  });

  it("writes ciphertext that does not expose case text or metadata", async () => {
    const file = await createCaseBackup([makeCase("case-secret")], PASSPHRASE);

    expect(file).not.toContain("Pune Municipal Corporation");
    expect(file).not.toContain("Sensitive source text");
    expect(file).not.toContain("1234 5678 9012");
    expect(file).not.toContain("REF-case-secret");
    expect(envelopeOf(file)).toMatchObject({
      format: BACKUP_FORMAT,
      version: 1,
      kdf: { name: "PBKDF2", hash: "SHA-256", iterations: 600_000 },
      cipher: { name: "AES-GCM" },
    });
  });

  it("rejects a wrong passphrase with a stable error code", async () => {
    const file = await createCaseBackup([makeCase("case-1")], PASSPHRASE);

    await expect(readCaseBackup(file, "this is not the passphrase")).rejects.toMatchObject({
      name: "CaseVaultError",
      code: "wrong_passphrase",
    });
  });

  it("rejects a tampered ciphertext", async () => {
    const file = await createCaseBackup([makeCase("case-1")], PASSPHRASE);
    const envelope = envelopeOf(file);
    const ciphertext = String(envelope.ciphertext);
    const index = 4;
    const replacement = ciphertext[index] === "A" ? "B" : "A";
    envelope.ciphertext = `${ciphertext.slice(0, index)}${replacement}${ciphertext.slice(index + 1)}`;

    await expect(readCaseBackup(JSON.stringify(envelope), PASSPHRASE)).rejects.toMatchObject({
      code: "wrong_passphrase",
    });
  });

  it("binds the envelope creation time to the ciphertext", async () => {
    const file = await createCaseBackup([makeCase("case-1")], PASSPHRASE);
    const envelope = envelopeOf(file);
    envelope.createdAt = "2020-01-01T00:00:00.000Z";

    await expect(readCaseBackup(JSON.stringify(envelope), PASSPHRASE)).rejects.toMatchObject({
      code: "wrong_passphrase",
    });
  });

  it("refuses a short passphrase before writing a file", async () => {
    await expect(createCaseBackup([makeCase("case-1")], "too short")).rejects.toMatchObject({
      code: "passphrase_too_short",
    });
  });

  it("explains an unsupported backup version instead of guessing", async () => {
    const file = await createCaseBackup([makeCase("case-1")], PASSPHRASE);
    const envelope = envelopeOf(file);
    envelope.version = 2;

    await expect(readCaseBackup(JSON.stringify(envelope), PASSPHRASE)).rejects.toMatchObject({
      code: "unsupported_version",
    });
  });

  it("rejects a file that is not a Nagrik Saathi backup", async () => {
    await expect(readCaseBackup("{\"hello\":\"world\"}", PASSPHRASE)).rejects.toMatchObject({
      code: "malformed_backup",
    });
    await expect(readCaseBackup("not json", PASSPHRASE)).rejects.toMatchObject({
      code: "malformed_backup",
    });
  });

  it("caps file size and case count before doing expensive work", async () => {
    await expect(
      readCaseBackup("x".repeat(MAX_BACKUP_BYTES + 1), PASSPHRASE),
    ).rejects.toMatchObject({ code: "too_large" });

    const tooMany = Array.from({ length: MAX_BACKUP_CASES + 1 }, (_, index) =>
      makeCase(`case-${index}`),
    );
    await expect(createCaseBackup(tooMany, PASSPHRASE)).rejects.toMatchObject({
      code: "too_many_cases",
    });
  });

  it("surfaces the CaseVaultError type to callers", async () => {
    const error = await readCaseBackup("not json", PASSPHRASE).catch((value: unknown) => value);
    expect(error).toBeInstanceOf(CaseVaultError);
  });
});
