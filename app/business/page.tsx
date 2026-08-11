import { Section } from "@/components/ui/section";
import { OutreachTracker } from "@/components/business/outreach-tracker";
import { CalendarGrid } from "@/components/business/calendar-grid";
import { PercentageLineChart } from "@/components/charts/percentage-line-chart";
import { outreachKonstanzMock } from "@/lib/mock-data";
import { isCalendarConnected, getCalendarEvents, currentWeekRangeBerlin, type CalendarEvent } from "@/lib/google-calendar";

export default async function BusinessPage() {
  const konstanz = outreachKonstanzMock();
  const connected = await isCalendarConnected();

  let events: CalendarEvent[] = [];
  if (connected) {
    const { mondayISO, sundayISO } = currentWeekRangeBerlin();
    try {
      events = await getCalendarEvents(mondayISO, sundayISO);
    } catch {
      // Connected but the fetch failed (e.g. expired grant) — show an empty
      // grid rather than crashing the page; the header still says "Verbunden".
    }
  }

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      <div className="grid grid-cols-3 gap-4 flex-[2] min-h-0">
        <div className="col-span-1 flex flex-col gap-4 min-h-0">
          <Section title="Outreach" className="flex-1">
            <OutreachTracker />
          </Section>
          <Section title="Outreach Konstanz" className="flex-1">
            <PercentageLineChart data={konstanz} />
          </Section>
        </div>
        <Section
          title="Google Calendar"
          className="col-span-2"
          action={
            connected ? (
              <span className="text-[10px] uppercase tracking-wider text-text-muted">
                Verbunden
              </span>
            ) : (
              <a
                href="/api/google/auth"
                className="text-[10px] font-medium uppercase tracking-wider text-text-secondary hover:text-text transition-colors"
              >
                Mit Google verbinden
              </a>
            )
          }
        >
          <CalendarGrid events={events} />
        </Section>
      </div>

      <Section title="Kunden" className="flex-1 min-h-[120px]" />
    </div>
  );
}
