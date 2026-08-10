import { WEEKDAYS_SHORT_DE } from "@/lib/constants";

interface CalendarEvent {
  day: number; // 0-6, Monday-based
  startHour: number;
  endHour: number;
  title: string;
}

const MOCK_EVENTS: CalendarEvent[] = [
  { day: 0, startHour: 9, endHour: 10, title: "Team Sync" },
  { day: 0, startHour: 14, endHour: 15.5, title: "Client Call" },
  { day: 1, startHour: 11, endHour: 12, title: "Strategy Review" },
  { day: 2, startHour: 16, endHour: 17, title: "Outreach Review" },
  { day: 3, startHour: 9.5, endHour: 10.5, title: "Investor Update" },
  { day: 4, startHour: 13, endHour: 14, title: "Product Planning" },
];

const START_HOUR = 8;
const END_HOUR = 19;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

/**
 * Mock weekly calendar grid. Google Calendar API data can later replace
 * MOCK_EVENTS without touching the rendering logic below.
 */
export function CalendarPlaceholder() {
  return (
    <div className="flex flex-col h-full min-h-0">
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
            {MOCK_EVENTS.filter((e) => e.day === day).map((e, i) => {
              const top = (e.startHour - START_HOUR) * 40;
              const height = (e.endHour - e.startHour) * 40;
              return (
                <div
                  key={i}
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
