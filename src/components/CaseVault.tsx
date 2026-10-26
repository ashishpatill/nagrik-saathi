"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  CaseVaultError,
  MAX_BACKUP_CASES,
  MIN_PASSPHRASE_LENGTH,
  createCaseBackup,
  readCaseBackup,
  type CaseVaultErrorCode,
} from "@/lib/case-vault";
import { downloadTextFile } from "@/lib/download";
import { deleteAllCases, importCases, listCases } from "@/lib/storage";

const ERROR_COPY: Record<CaseVaultErrorCode, string> = {
  passphrase_too_short: `Use a passphrase of at least ${MIN_PASSPHRASE_LENGTH} characters.`,
  too_many_cases: `A backup can hold at most ${MAX_BACKUP_CASES} cases. Delete a few and try again.`,
  too_large: "This file is larger than the 8 MB backup limit.",
  malformed_backup:
    "This file is not a Nagrik Saathi encrypted backup, or it is damaged.",
  unsupported_version:
    "This backup was made by a different version of Nagrik Saathi. Update the app and try again.",
  wrong_passphrase:
    "That passphrase did not decrypt the file, or the file was changed. Check the passphrase and try again.",
  crypto_unavailable:
    "This browser cannot encrypt backups. Use a current browser over HTTPS or localhost.",
};

type Notice = { tone: "success" | "error"; text: string };
type Busy = "export" | "import" | "delete" | null;

function messageFor(error: unknown): string {
  if (error instanceof CaseVaultError) return ERROR_COPY[error.code];
  return "Something went wrong. Nothing was changed.";
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function CaseVault() {
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [countFailed, setCountFailed] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [importPassphrase, setImportPassphrase] = useState("");
  const [busy, setBusy] = useState<Busy>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    // The IndexedDB read lands in a promise callback, not in the effect body,
    // so the first render stays a pure snapshot.
    Promise.resolve()
      .then(() => listCases())
      .then((cases) => {
        if (!cancelled) setSavedCount(cases.length);
      })
      .catch(() => {
        if (!cancelled) setCountFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function refreshCount() {
    void listCases()
      .then((cases) => {
        setSavedCount(cases.length);
        setCountFailed(false);
      })
      .catch(() => setCountFailed(true));
  }

  async function handleExport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    if (passphrase.length < MIN_PASSPHRASE_LENGTH) {
      setNotice({
        tone: "error",
        text: `Use a passphrase of at least ${MIN_PASSPHRASE_LENGTH} characters.`,
      });
      return;
    }
    if (passphrase !== confirmation) {
      setNotice({
        tone: "error",
        text: "The two passphrases do not match. Type them again.",
      });
      return;
    }

    setBusy("export");
    try {
      const cases = await listCases();
      if (cases.length === 0) {
        setNotice({
          tone: "error",
          text: "There are no saved cases to back up yet. Analyze a notice first.",
        });
        return;
      }
      const file = await createCaseBackup(cases, passphrase);
      downloadTextFile(
        `nagrik-saathi-backup-${today()}.json`,
        file,
        "application/json",
      );
      setPassphrase("");
      setConfirmation("");
      setNotice({
        tone: "success",
        text: `Encrypted backup of ${cases.length} ${
          cases.length === 1 ? "case" : "cases"
        } downloaded. Store the passphrase separately; it cannot be recovered.`,
      });
    } catch (error) {
      setNotice({ tone: "error", text: messageFor(error) });
    } finally {
      setBusy(null);
      refreshCount();
    }
  }

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    const file = importInputRef.current?.files?.[0];
    if (!file) {
      setNotice({ tone: "error", text: "Choose an encrypted backup file first." });
      return;
    }
    if (!importPassphrase) {
      setNotice({ tone: "error", text: "Enter the passphrase for this backup." });
      return;
    }

    setBusy("import");
    try {
      const text = await file.text();
      const cases = await readCaseBackup(text, importPassphrase);
      if (cases.length === 0) {
        setNotice({
          tone: "error",
          text: "This backup contains no saved cases.",
        });
        return;
      }
      const restored = await importCases(cases);
      setImportPassphrase("");
      if (importInputRef.current) importInputRef.current.value = "";
      setSavedCount(null);
      setNotice({
        tone: "success",
        text: `Restored ${restored} ${
          restored === 1 ? "case" : "cases"
        }. The first restored case is now active; open the workspace to continue.`,
      });
    } catch (error) {
      setNotice({ tone: "error", text: messageFor(error) });
    } finally {
      setBusy(null);
      refreshCount();
    }
  }

  async function handleDelete() {
    setNotice(null);
    setBusy("delete");
    try {
      const removed = await deleteAllCases();
      setSavedCount(0);
      setDeleteArmed(false);
      setNotice({
        tone: "success",
        text: `Deleted ${removed} saved ${
          removed === 1 ? "case" : "cases"
        } and the active case pointer from this browser. Other tabs keep a notice already open in memory until they are closed.`,
      });
    } catch {
      setNotice({
        tone: "error",
        text: "The saved cases could not be deleted. Close other tabs of this app and try again.",
      });
    } finally {
      setBusy(null);
    }
  }

  const countLabel =
    savedCount === null
      ? countFailed
        ? "Saved cases could not be counted."
        : "Checking saved cases in this browser."
      : `${savedCount} saved ${savedCount === 1 ? "case" : "cases"} in this browser.`;

  return (
    <div className="mt-8 space-y-6">
      <p
        className="border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-sm font-semibold text-[var(--ink)]"
        aria-live="polite"
      >
        {countLabel}
      </p>

      {notice ? (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          aria-live="polite"
          className={
            notice.tone === "error"
              ? "border border-[#8a2f2f] bg-[#f8e9e9] px-4 py-3 text-sm leading-6 text-[#8a2f2f]"
              : "border border-[var(--signal)] bg-[var(--signal-soft)] px-4 py-3 text-sm leading-6 text-[var(--signal)]"
          }
        >
          {notice.text}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="backup-heading"
          className="border border-[var(--line)] bg-[var(--panel)] p-5"
        >
          <h2
            id="backup-heading"
            className="font-display text-2xl font-semibold tracking-tight text-[var(--ink)]"
          >
            Make an encrypted backup
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
            Encryption happens in this tab before the file is written. Nagrik
            Saathi never receives the passphrase or the plaintext backup. If you
            lose the passphrase, the file cannot be recovered.
          </p>
          <form onSubmit={handleExport} className="mt-5 space-y-4">
            <label className="block text-sm font-semibold text-[var(--ink)]">
              Passphrase
              <span className="mt-1 block text-xs font-normal text-[var(--muted)]">
                At least {MIN_PASSPHRASE_LENGTH} characters. A long phrase of
                several words is easier to remember than a short password.
              </span>
              <input
                type="password"
                required
                minLength={MIN_PASSPHRASE_LENGTH}
                autoComplete="new-password"
                value={passphrase}
                onChange={(event) => setPassphrase(event.target.value)}
                className="mt-2 w-full rounded-[var(--radius)] border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm text-[var(--ink)]"
              />
            </label>
            <label className="block text-sm font-semibold text-[var(--ink)]">
              Repeat passphrase
              <input
                type="password"
                required
                minLength={MIN_PASSPHRASE_LENGTH}
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className="mt-2 w-full rounded-[var(--radius)] border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm text-[var(--ink)]"
              />
            </label>
            <button
              type="submit"
              disabled={busy !== null || savedCount === 0}
              className="rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-55"
            >
              {busy === "export" ? "Encrypting..." : "Download encrypted backup"}
            </button>
          </form>
          <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
            The downloaded file is ciphertext. It can travel by email or cloud
            storage, but send the passphrase through a different channel.
          </p>
        </section>

        <section
          aria-labelledby="restore-heading"
          className="border border-[var(--line)] bg-[var(--panel)] p-5"
        >
          <h2
            id="restore-heading"
            className="font-display text-2xl font-semibold tracking-tight text-[var(--ink)]"
          >
            Restore from a backup
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
            Open a backup made by this app on any device. Cases with the same
            ID are replaced; other saved cases stay in this browser. The first
            restored case becomes the active case.
          </p>
          <form onSubmit={handleImport} className="mt-5 space-y-4">
            <label className="block text-sm font-semibold text-[var(--ink)]">
              Encrypted backup file
              <input
                ref={importInputRef}
                type="file"
                required
                accept=".json,application/json"
                className="mt-2 block w-full text-sm text-[var(--ink-soft)] file:mr-3 file:rounded-[var(--radius)] file:border file:border-[var(--line)] file:bg-[var(--wash)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--ink)]"
              />
            </label>
            <label className="block text-sm font-semibold text-[var(--ink)]">
              Passphrase
              <input
                type="password"
                autoComplete="current-password"
                value={importPassphrase}
                onChange={(event) => setImportPassphrase(event.target.value)}
                className="mt-2 w-full rounded-[var(--radius)] border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm text-[var(--ink)]"
              />
            </label>
            <button
              type="submit"
              disabled={busy !== null}
              className="rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-55"
            >
              {busy === "import" ? "Decrypting..." : "Restore cases"}
            </button>
          </form>
        </section>
      </div>

      <section
        aria-labelledby="delete-heading"
        className="border border-[#8a2f2f] bg-[#f8e9e9] p-5"
      >
        <h2
          id="delete-heading"
          className="font-display text-2xl font-semibold tracking-tight text-[#6f2424]"
        >
          Delete everything from this browser
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f2424]">
          This removes every saved case and the active case pointer from this
          browser. It does not touch a backup you downloaded, and it cannot be
          undone. Language and display preferences are not case data and are
          left in place.
        </p>
        {deleteArmed ? (
          <div className="mt-4 flex flex-wrap items-center gap-3" role="alert">
            <p className="text-sm font-semibold text-[#6f2424]">
              Delete all saved cases now?
            </p>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={busy !== null}
              className="rounded-[var(--radius)] border border-[#6f2424] bg-[#6f2424] px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-55"
            >
              {busy === "delete" ? "Deleting..." : "Yes, delete everything"}
            </button>
            <button
              type="button"
              onClick={() => setDeleteArmed(false)}
              disabled={busy !== null}
              className="rounded-[var(--radius)] border border-[#6f2424] px-4 py-2 text-sm font-semibold text-[#6f2424]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setNotice(null);
              setDeleteArmed(true);
            }}
            disabled={busy !== null || savedCount === 0}
            className="mt-4 rounded-[var(--radius)] border border-[#6f2424] px-4 py-2 text-sm font-semibold text-[#6f2424] transition disabled:cursor-not-allowed disabled:opacity-55"
          >
            Delete all saved cases
          </button>
        )}
      </section>
    </div>
  );
}
