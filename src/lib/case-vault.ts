import { z } from "zod";
import type { DocumentAnalysis } from "@/lib/types";

/**
 * Client-side encrypted backup for saved cases.
 *
 * The passphrase never leaves the browser. It is stretched with PBKDF2 and
 * used to encrypt the case bundle with AES-GCM before a download is created,
 * so the resulting file is ciphertext even in the user's Downloads folder.
 *
 * This is the zero-knowledge cross-device path. There is no server-side case
 * store and no automatic sync; see docs/SAFETY.md for the boundary.
 */

export const BACKUP_FORMAT = "nagrik-saathi-case-backup";
export const BACKUP_VERSION = 1;
export const KDF_ITERATIONS = 600_000;
export const MIN_PASSPHRASE_LENGTH = 12;
export const MAX_BACKUP_BYTES = 8 * 1024 * 1024;
export const MAX_BACKUP_CASES = 200;

const SALT_BYTES = 16;
const IV_BYTES = 12;

export type CaseVaultErrorCode =
  | "passphrase_too_short"
  | "too_many_cases"
  | "too_large"
  | "malformed_backup"
  | "unsupported_version"
  | "wrong_passphrase"
  | "crypto_unavailable";

export class CaseVaultError extends Error {
  readonly code: CaseVaultErrorCode;

  constructor(code: CaseVaultErrorCode, message: string) {
    super(message);
    this.name = "CaseVaultError";
    this.code = code;
  }
}

const summarySchema = z.strictObject({
  en: z.string(),
  hi: z.string(),
  mr: z.string(),
  ta: z.string(),
  kn: z.string(),
  gu: z.string(),
  te: z.string(),
  bn: z.string(),
});

const documentAnalysisSchema = z.strictObject({
  id: z.string().min(1),
  fileName: z.string(),
  documentType: z.enum([
    "electricity_bill",
    "payment_receipt",
    "property_tax",
    "traffic_challan",
    "grievance_notice",
    "other",
  ]),
  issuer: z.string(),
  referenceNumber: z.string(),
  deadlineDate: z.string().nullable(),
  amountDue: z.number().nullable(),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  scamRiskScore: z.enum(["safe", "suspicious", "fraud_alert"]),
  riskReason: z.string(),
  summary: summarySchema,
  requiredActionItems: z.array(z.string()),
  requiredDocuments: z.array(z.string()),
  officialDepartmentKey: z.string(),
  sourceText: z.string(),
}) satisfies z.ZodType<DocumentAnalysis>;

const payloadSchema = z
  .strictObject({
    cases: z.array(documentAnalysisSchema).max(MAX_BACKUP_CASES),
  })
  .superRefine((value, context) => {
    const ids = new Set<string>();
    for (const item of value.cases) {
      if (ids.has(item.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate case ID: ${item.id}`,
          path: ["cases"],
        });
      }
      ids.add(item.id);
    }
  });

const envelopeSchema = z.strictObject({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(BACKUP_VERSION),
  createdAt: z.iso.datetime(),
  kdf: z.strictObject({
    name: z.literal("PBKDF2"),
    hash: z.literal("SHA-256"),
    iterations: z.literal(KDF_ITERATIONS),
    salt: z.string().min(1),
  }),
  cipher: z.strictObject({
    name: z.literal("AES-GCM"),
    iv: z.string().min(1),
  }),
  ciphertext: z.string().min(1),
});

const headerSchema = z
  .object({ format: z.string(), version: z.number() })
  .passthrough();

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array | null {
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
}

function assertPassphrase(passphrase: string): void {
  if (passphrase.length < MIN_PASSPHRASE_LENGTH) {
    throw new CaseVaultError(
      "passphrase_too_short",
      `Use a passphrase of at least ${MIN_PASSPHRASE_LENGTH} characters.`,
    );
  }
}

function webCrypto(): Crypto {
  const value = globalThis.crypto;
  if (!value?.subtle) {
    throw new CaseVaultError(
      "crypto_unavailable",
      "This browser cannot encrypt or decrypt backups. Use a current browser over HTTPS or localhost.",
    );
  }
  return value;
}

async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
  usage: KeyUsage[],
): Promise<CryptoKey> {
  const material = await webCrypto().subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return webCrypto().subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    usage,
  );
}

function additionalData(createdAt: string): Uint8Array {
  return new TextEncoder().encode(
    `${BACKUP_FORMAT}:${BACKUP_VERSION}:${createdAt}`,
  );
}

export async function createCaseBackup(
  cases: readonly DocumentAnalysis[],
  passphrase: string,
): Promise<string> {
  assertPassphrase(passphrase);
  if (cases.length > MAX_BACKUP_CASES) {
    throw new CaseVaultError(
      "too_many_cases",
      `A backup can hold at most ${MAX_BACKUP_CASES} cases.`,
    );
  }

  const payload = payloadSchema.parse({ cases });
  const salt = webCrypto().getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = webCrypto().getRandomValues(new Uint8Array(IV_BYTES));
  const createdAt = new Date().toISOString();
  const key = await deriveKey(passphrase, salt, KDF_ITERATIONS, ["encrypt"]);
  const encrypted = await webCrypto().subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as BufferSource,
      additionalData: additionalData(createdAt) as BufferSource,
    },
    key,
    new TextEncoder().encode(JSON.stringify(payload)),
  );

  const envelope = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt,
    kdf: {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: KDF_ITERATIONS,
      salt: toBase64(salt),
    },
    cipher: { name: "AES-GCM", iv: toBase64(iv) },
    ciphertext: toBase64(new Uint8Array(encrypted)),
  };

  return `${JSON.stringify(envelope, null, 2)}\n`;
}

export async function readCaseBackup(
  text: string,
  passphrase: string,
): Promise<DocumentAnalysis[]> {
  if (text.length > MAX_BACKUP_BYTES) {
    throw new CaseVaultError(
      "too_large",
      "This file is larger than the 8 MB backup limit.",
    );
  }
  assertPassphrase(passphrase);

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new CaseVaultError(
      "malformed_backup",
      "This is not a Nagrik Saathi backup file.",
    );
  }

  const header = headerSchema.safeParse(parsed);
  if (!header.success || header.data.format !== BACKUP_FORMAT) {
    throw new CaseVaultError(
      "malformed_backup",
      "This is not a Nagrik Saathi backup file.",
    );
  }
  if (header.data.version !== BACKUP_VERSION) {
    throw new CaseVaultError(
      "unsupported_version",
      "This backup was made by a different version of Nagrik Saathi.",
    );
  }

  const envelope = envelopeSchema.safeParse(parsed);
  if (!envelope.success) {
    throw new CaseVaultError(
      "malformed_backup",
      "This backup file is incomplete or damaged.",
    );
  }

  const salt = fromBase64(envelope.data.kdf.salt);
  const iv = fromBase64(envelope.data.cipher.iv);
  if (!salt || salt.length !== SALT_BYTES || !iv || iv.length !== IV_BYTES) {
    throw new CaseVaultError(
      "malformed_backup",
      "This backup file is incomplete or damaged.",
    );
  }

  let decrypted: ArrayBuffer;
  try {
    const key = await deriveKey(passphrase, salt, KDF_ITERATIONS, ["decrypt"]);
    decrypted = await webCrypto().subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv as BufferSource,
        additionalData: additionalData(envelope.data.createdAt) as BufferSource,
      },
      key,
      fromBase64(envelope.data.ciphertext) as BufferSource,
    );
  } catch {
    throw new CaseVaultError(
      "wrong_passphrase",
      "The passphrase did not decrypt this file, or the file was changed.",
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder().decode(decrypted));
  } catch {
    throw new CaseVaultError(
      "malformed_backup",
      "The decrypted backup is not readable.",
    );
  }

  const result = payloadSchema.safeParse(payload);
  if (!result.success) {
    throw new CaseVaultError(
      "malformed_backup",
      "The decrypted backup does not match the expected case format.",
    );
  }

  return result.data.cases;
}
