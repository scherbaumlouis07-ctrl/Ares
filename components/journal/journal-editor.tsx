"use client";

import { useState } from "react";
import { Mic, Send } from "lucide-react";
import { addJournalEntry } from "@/lib/journal-storage";
import { cn } from "@/lib/utils";

export function JournalEditor({ onSaved }: { onSaved: () => void }) {
  const [content, setContent] = useState("");
  const [dictating, setDictating] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!content.trim() || saving) return;
    setSaving(true);
    try {
      await addJournalEntry(content.trim());
      setContent("");
      onSaved();
    } catch (error) {
      console.error("Journal-Eintrag konnte nicht gespeichert werden:", error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Schreiben Sie Ihre Gedanken, Sir..."
        rows={10}
        className="w-full resize-none bg-surface-2 border border-border focus:border-border-strong outline-none px-5 py-4 text-sm leading-relaxed text-text placeholder:text-text-muted transition-colors duration-150"
      />
      <div className="flex items-center justify-between">
        <button
          onClick={() => setDictating((v) => !v)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 border text-xs font-medium uppercase tracking-wider transition-colors",
            dictating
              ? "border-critical/50 text-critical"
              : "border-border text-text-secondary hover:border-border-strong hover:text-text"
          )}
        >
          <Mic size={13} />
          Diktieren
        </button>
        <button
          onClick={handleSave}
          disabled={!content.trim() || saving}
          className="flex items-center gap-2 px-5 py-2 bg-text text-bg text-xs font-medium uppercase tracking-wider disabled:opacity-30 disabled:pointer-events-none hover:bg-white transition-colors"
        >
          <Send size={13} />
          Speichern
        </button>
      </div>
    </div>
  );
}
