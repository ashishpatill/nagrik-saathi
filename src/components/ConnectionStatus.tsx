"use client";

import { useEffect, useState } from "react";

export default function ConnectionStatus() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--warn)] bg-[var(--warn-soft)] px-4 py-2 text-center text-sm font-semibold text-[var(--warn)]"
    >
      You are offline. Cached playbooks and your saved case are still available; new
      analysis waits for a connection.
    </div>
  );
}
