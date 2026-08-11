import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";

export const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} ist nicht konfiguriert.`);
  return value;
}

function createOAuthClient() {
  return new google.auth.OAuth2(
    getEnv("GOOGLE_CLIENT_ID"),
    getEnv("GOOGLE_CLIENT_SECRET"),
    getEnv("GOOGLE_REDIRECT_URI")
  );
}

export function buildGoogleAuthUrl(): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [GOOGLE_CALENDAR_SCOPE],
  });
}

export async function exchangeCodeAndStore(code: string): Promise<void> {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht angemeldet.");
  if (!tokens.access_token || !tokens.expiry_date) {
    throw new Error("Google hat keine gültigen Tokens zurückgegeben.");
  }

  const { error } = await supabase.from("google_calendar_connections").upsert(
    {
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? undefined,
      scope: tokens.scope ?? GOOGLE_CALENDAR_SCOPE,
      token_type: tokens.token_type ?? "Bearer",
      expiry_date: tokens.expiry_date,
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}

export async function isCalendarConnected(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("google_calendar_connections")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  return Boolean(data);
}

async function getAuthorizedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht angemeldet.");

  const { data: connection, error } = await supabase
    .from("google_calendar_connections")
    .select("access_token, refresh_token, scope, token_type, expiry_date")
    .eq("user_id", user.id)
    .single();

  if (error || !connection) {
    throw new Error("Google Calendar ist noch nicht verbunden.");
  }

  const client = createOAuthClient();
  client.setCredentials({
    access_token: connection.access_token,
    refresh_token: connection.refresh_token,
    scope: connection.scope,
    token_type: connection.token_type,
    expiry_date: Number(connection.expiry_date),
  });

  // Persists a refreshed access token back to Supabase whenever the SDK
  // silently renews it, so the next request doesn't need to refresh again.
  client.on("tokens", (tokens) => {
    if (!tokens.access_token) return;
    void supabase
      .from("google_calendar_connections")
      .update({
        access_token: tokens.access_token,
        expiry_date: tokens.expiry_date ?? connection.expiry_date,
        ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
      })
      .eq("user_id", user.id);
  });

  return client;
}

export interface CalendarEvent {
  id: string | null | undefined;
  summary: string | null | undefined;
  start: string | null | undefined;
  end: string | null | undefined;
  location: string | null | undefined;
}

/** Termine und Meetings im angegebenen Zeitraum. */
export async function getCalendarEvents(timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 50,
  });

  return (res.data.items ?? []).map((event) => ({
    id: event.id,
    summary: event.summary,
    start: event.start?.dateTime ?? event.start?.date,
    end: event.end?.dateTime ?? event.end?.date,
    location: event.location,
  }));
}

function berlinOffset(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+1";
  const hours = Number(tzName.match(/GMT([+-]\d+)/)?.[1] ?? 1);
  return `${hours >= 0 ? "+" : "-"}${String(Math.abs(hours)).padStart(2, "0")}:00`;
}

/** Monday 00:00 to Sunday 23:59:59 of the current week, as offset-correct Berlin ISO timestamps. */
export function currentWeekRangeBerlin(): { mondayISO: string; sundayISO: string } {
  const now = new Date();
  const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Berlin", weekday: "short" }).format(now);
  const todayIdx = order.indexOf(weekday);

  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const map = Object.fromEntries(dateParts.map((p) => [p.type, p.value]));
  // Noon anchor avoids the date shifting by a day when subtracting near a DST boundary.
  const todayNoonUTC = new Date(Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day), 12));

  const monday = new Date(todayNoonUTC);
  monday.setUTCDate(monday.getUTCDate() - todayIdx);
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);

  const offset = berlinOffset(now);
  const isoDate = (d: Date, time: string) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}T${time}${offset}`;

  return { mondayISO: isoDate(monday, "00:00:00"), sundayISO: isoDate(sunday, "23:59:59") };
}

/** Belegte Zeiträume im angegebenen Fenster — daraus lassen sich freie Zeiten ableiten. */
export async function getBusyTimes(
  timeMin: string,
  timeMax: string
): Promise<{ start: string; end: string }[]> {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.freebusy.query({
    requestBody: { timeMin, timeMax, items: [{ id: "primary" }] },
  });

  const busy = res.data.calendars?.primary?.busy ?? [];
  return busy
    .filter((b) => b.start && b.end)
    .map((b) => ({ start: b.start as string, end: b.end as string }));
}
