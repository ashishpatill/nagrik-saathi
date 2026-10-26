import type { Metadata } from "next";
import Link from "next/link";
import CaseVault from "@/components/CaseVault";

export const metadata: Metadata = {
  title: "Your data | Nagrik Saathi",
  description:
    "How Nagrik Saathi keeps notice data in your browser, how to make an encrypted backup you can restore on another device, and how to delete everything.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 md:px-8 md:pt-12">
        <header className="anim-rise border-b border-[var(--line)] pb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                Privacy · your data
              </p>
              <h1 className="font-display mt-3 text-[clamp(2.1rem,5vw,3.6rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-[var(--ink)]">
                Your data stays in this browser
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--ink-soft)]">
                There is no account and no server-side case store. Saved notices
                live in this browser. You can carry them to another device with
                an encrypted backup that only your passphrase can open, and you
                can delete everything here.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] transition hover:border-[var(--accent)]"
              >
                Back to workspace
              </Link>
              <Link
                href="/status"
                className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--panel)] px-4 py-2 text-sm font-semibold text-[var(--ink-soft)] transition hover:border-[var(--accent)]"
              >
                Portal status
              </Link>
            </div>
          </div>
        </header>

        <CaseVault />

        <section aria-labelledby="stored-heading" className="mt-10">
          <h2
            id="stored-heading"
            className="font-display text-2xl font-semibold tracking-tight text-[var(--ink)]"
          >
            What is stored, and where
          </h2>
          <div className="mt-4 overflow-x-auto border border-[var(--line)]">
            <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[var(--wash)] text-xs uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Data
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Where it goes
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    How long
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] text-[var(--ink-soft)]">
                <tr>
                  <th scope="row" className="px-4 py-3 font-semibold text-[var(--ink)]">
                    Notice text and extracted fields
                  </th>
                  <td className="px-4 py-3">
                    IndexedDB in this browser, when a notice is analyzed
                  </td>
                  <td className="px-4 py-3">Until you delete it</td>
                </tr>
                <tr>
                  <th scope="row" className="px-4 py-3 font-semibold text-[var(--ink)]">
                    Active case pointer
                  </th>
                  <td className="px-4 py-3">localStorage in this browser</td>
                  <td className="px-4 py-3">Until you delete it or clear the notice</td>
                </tr>
                <tr>
                  <th scope="row" className="px-4 py-3 font-semibold text-[var(--ink)]">
                    Encrypted backup
                  </th>
                  <td className="px-4 py-3">
                    Your Downloads folder, or wherever you move the file.
                    Ciphertext only.
                  </td>
                  <td className="px-4 py-3">
                    Until you delete the file. The passphrase is never stored.
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="px-4 py-3 font-semibold text-[var(--ink)]">
                    Language and display preferences
                  </th>
                  <td className="px-4 py-3">localStorage in this browser</td>
                  <td className="px-4 py-3">Until you clear site data</td>
                </tr>
                <tr>
                  <th scope="row" className="px-4 py-3 font-semibold text-[var(--ink)]">
                    Last portal health result
                  </th>
                  <td className="px-4 py-3">
                    localStorage in this browser. Public portal data only.
                  </td>
                  <td className="px-4 py-3">Replaced by the next successful check</td>
                </tr>
                <tr>
                  <th scope="row" className="px-4 py-3 font-semibold text-[var(--ink)]">
                    Tool activity in the inspector
                  </th>
                  <td className="px-4 py-3">
                    Memory in the workspace tab. It is not written to storage.
                  </td>
                  <td className="px-4 py-3">Cleared on refresh</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="not-do-heading" className="mt-10 grid gap-6 lg:grid-cols-2">
          <div>
            <h2
              id="not-do-heading"
              className="font-display text-2xl font-semibold tracking-tight text-[var(--ink)]"
            >
              What Nagrik Saathi does not do
            </h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-[var(--ink-soft)]">
              <li>It does not create an account or issue a passkey yet.</li>
              <li>It does not store cases on a server or sync them automatically.</li>
              <li>It does not receive, store, or reset your backup passphrase.</li>
              <li>
                It does not log in, pay, file, submit, or send anything on your
                behalf.
              </li>
              <li>
                It does not ask for an Aadhaar number, PAN, OTP, PIN, or
                government portal password.
              </li>
            </ul>
          </div>
          <div className="border border-[var(--warn)] bg-[var(--warn-soft)] p-5">
            <h2 className="font-display text-xl font-semibold text-[var(--warn)]">
              If you lose the passphrase
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--warn)]">
              The backup cannot be decrypted by us or by anyone else. Make a new
              backup with a passphrase you can keep safely, and store the
              passphrase somewhere separate from the file.
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--warn)]">
              Automatic cross-device sync would need a hosted case store and
              passkey identity. That is not built, so the encrypted file is the
              only cross-device path today.
            </p>
          </div>
        </section>

        <section aria-labelledby="delete-note-heading" className="mt-10">
          <h2
            id="delete-note-heading"
            className="font-display text-2xl font-semibold tracking-tight text-[var(--ink)]"
          >
            Deletion, precisely
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-soft)]">
            Deleting from this page clears the cases in this browser and the
            active case pointer. It cannot reach a backup you already
            downloaded, a copy in another browser, or a copy on another device.
            Delete those separately. Because there is no server-side case store,
            there is no server-side deletion endpoint to call.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ink-soft)]">
            The optional <code className="font-mono text-xs">/api/analyze</code>{" "}
            route receives notice text only when a caller sends it, returns an
            analysis in the response, and persists nothing. The citizen
            workspace analyzes notice text in the tab.
          </p>
        </section>
      </div>
    </main>
  );
}
