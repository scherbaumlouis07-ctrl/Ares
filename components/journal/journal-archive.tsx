"use client";

import { X } from "lucide-react";
import type { JournalEntry } from "@/lib/journal-storage";

function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    date: new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric" }).format(d),
    time: new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(d),
  };
}

export function JournalArchive({
  entries,
  onClose,
}: {
  entries: JournalEntry[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <div className="w-full max-w-xl h-full bg-surface border-l border-border flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-sm font-medium uppercase tracking-wider text-text-secondary">
            Journal Archiv
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          {entries.length === 0 && (
            <p className="text-sm text-text-muted">Noch keine Einträge vorhanden.</p>
          )}
          {entries.map((entry) => {
            const { date, time } = formatDate(entry.createdAt);
            return (
              <div key={entry.id} className="border border-border bg-surface-2 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-text-muted">{date}</span>
                  <span className="text-[10px] uppercase tracking-wider text-text-muted">{time}</span>
                </div>
                <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{entry.content}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
