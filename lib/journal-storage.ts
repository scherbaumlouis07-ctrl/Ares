"use client";

import { createClient } from "@/lib/supabase/client";

const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 6;
const SELECT_COLUMNS = "id, content, entry_date, entry_time, created_at";

export interface JournalEntry {
  id: string;
  content: string; // Text
  date: string; // Datum (YYYY-MM-DD)
  time: string; // Uhrzeit (HH:MM:SS)
  createdAt: string; // created_at, ISO timestamp
}

function sixMonthsAgoIso(): string {
  return new Date(Date.now() - SIX_MONTHS_MS).toISOString();
}

/** Deletes entries older than six months. Called on every load/write so retention is self-enforcing. */
async function pruneExpired(): Promise<void> {
  const supabase = createClient();
  await supabase.from("journal_entries").delete().lt("created_at", sixMonthsAgoIso());
}

function toJournalEntry(row: {
  id: string;
  content: string;
  entry_date: string;
  entry_time: string;
  created_at: string;
}): JournalEntry {
  return {
    id: row.id,
    content: row.content,
    date: row.entry_date,
    time: row.entry_time,
    createdAt: row.created_at,
  };
}

export async function loadJournalEntries(): Promise<JournalEntry[]> {
  await pruneExpired();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .select(SELECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map(toJournalEntry);
}

export async function addJournalEntry(content: string): Promise<JournalEntry> {
  await pruneExpired();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .insert({ content })
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw error;

  return toJournalEntry(data);
}
