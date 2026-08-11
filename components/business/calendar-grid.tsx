import { WEEKDAYS_SHORT_DE } from "@/lib/constants";
import type { CalendarEvent } from "@/lib/google-calendar";

const START_HOUR = 8;
const END_HOUR = 19;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
const WEEKDAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface PositionedEvent {
  id: string;
  day: number;
  startHour: number;
  endHour: number;
  title: string;
}

function isAllDay(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toBerlinDayAndHour(iso: string): { day: number; hour: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { day: WEEKDAY_ORDER.indexOf(map.weekday), hour: Number(map.hour) + Number(map.minute) / 60 };
}

/**
 * Live weekly view of the connected Google Calendar. Same grid the mock
 * version used — only the event source changed, from hardcoded MOCK_EVENTS
 * to real events positioned by their actual Berlin-time day/hour.
 */
export function CalendarGrid({ events }: { events: CalendarEvent[] }) {
  const allDayEvents = events.filter((e) => e.start && isAllDay(e.start));

  const timedEvents: PositionedEvent[] = events
    .filter((e) => e.id && e.start && e.end && !isAllDay(e.start))
    .map((e) => {
      const { day, hour: startHour } = toBerlinDayAndHour(e.start as string);
      const { hour: endHourRaw } = toBerlinDayAndHour(e.end as string);
      return {
        id: e.id as string,
        day,
        startHour,
        endHour: Math.max(endHourRaw, startHour + 0.5),
        title: e.summary || "(Ohne Titel)",
      };
    })
    .filter((e) => e.day >= 0);

  return (
    <div className="flex flex-col h-full min-h-0">
      {allDayEvents.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pb-2 shrink-0">
          {allDayEvents.map((e) => (
            <span key={e.id} className="text-[10px] text-text-secondary border border-border px-1.5 py-0.5">
              {e.summary || "(Ohne Titel)"}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-[44px_repeat(7,1fr)] shrink-0">
        <div />
        {WEEKDAYS_SHORT_DE.map((d) => (
          <div key={d} className="text-[10px] uppercase tracking-wider text-text-muted text-center pb-2">
            {d}
          </div>
        ))}
      </div>
      <div className="relative grid grid-cols-[44px_repeat(7,1fr)] flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col">
          {HOURS.map((h) => (
            <div key={h} className="h-10 text-[10px] text-text-muted text-right pr-2 -translate-y-1.5">
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>
        {Array.from({ length: 7 }, (_, day) => (
          <div key={day} className="relative border-l border-border">
            {HOURS.map((h) => (
              <div key={h} className="h-10 border-b border-border/60" />
            ))}
            {timedEvents
              .filter((e) => e.day === day)
              .map((e) => {
                const clampedStart = Math.max(e.startHour, START_HOUR);
                const clampedEnd = Math.min(e.endHour, END_HOUR + 1);
                const top = (clampedStart - START_HOUR) * 40;
                const height = Math.max((clampedEnd - clampedStart) * 40, 16);
                return (
                  <div
                    key={e.id}
                    className="absolute left-0.5 right-0.5 bg-elevated-2 border border-border-strong px-1.5 py-1 overflow-hidden"
                    style={{ top, height }}
                  >
                    <span className="text-[10px] text-text truncate block">{e.title}</span>
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
