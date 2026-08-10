"use client";

import { useEffect, useState } from "react";
import { Archive } from "lucide-react";
import { JournalEditor } from "@/components/journal/journal-editor";
import { JournalArchive } from "@/components/journal/journal-archive";
import { loadJournalEntries, type JournalEntry } from "@/lib/journal-storage";

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [archiveOpen, setArchiveOpen] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const loaded = await loadJournalEntries();
    setEntries(loaded);
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 px-8">
      <JournalEditor onSaved={refresh} />
      <button
        onClick={() => setArchiveOpen(true)}
        className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-muted hover:text-text transition-colors"
      >
        <Archive size={13} />
        Journal Archiv
      </button>

      {archiveOpen && <JournalArchive entries={entries} onClose={() => setArchiveOpen(false)} />}
    </div>
  );
}
