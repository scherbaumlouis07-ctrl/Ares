import { Section } from "@/components/ui/section";
import { IntelligencePanel } from "@/components/intelligence/intelligence-panel";
import { createClient } from "@/lib/supabase/server";

const CATEGORY_LABELS: Record<string, string> = {
  stock: "Aktie",
  industry: "Branche",
  technology: "Technologie",
  commodity: "Rohstoff",
  macro: "Makrotrend",
};

interface Opportunity {
  id: string;
  title: string;
  category: string;
  ticker: string | null;
  thesis: string;
  created_at: string;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(iso)
  );
}

export default async function InvestmentsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("investment_opportunities")
    .select("id, title, category, ticker, thesis, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const opportunities = (data ?? []) as Opportunity[];

  const entries = opportunities.map((o) => ({
    title: o.title,
    body: o.thesis,
    tag: `${CATEGORY_LABELS[o.category] ?? o.category} · ${formatDate(o.created_at)}`,
  }));

  return (
    <div className="h-full flex p-4 gap-4">
      <Section title="Ares Investment Intelligence" className="w-1/3 shrink-0">
        <IntelligencePanel
          heading="Investments"
          entries={entries}
          readAloudLabel="Ares Vorlesen"
        />
      </Section>

      <div className="w-2/3 flex flex-col gap-4 min-h-0 overflow-y-auto">
        {opportunities.length === 0 ? (
          <Section className="flex-1 min-h-[120px]">
            <div className="h-full flex items-center justify-center text-sm text-text-muted">
              Noch keine Opportunities recherchiert. Frag Ares im Chat danach.
            </div>
          </Section>
        ) : (
          opportunities.map((opp) => (
            <Section
              key={opp.id}
              title={opp.ticker ? `${opp.title} · ${opp.ticker}` : opp.title}
              className="shrink-0"
            >
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-wider text-text-muted">
                  {CATEGORY_LABELS[opp.category] ?? opp.category} · {formatDate(opp.created_at)}
                </span>
                <p className="text-sm leading-relaxed text-text-secondary">{opp.thesis}</p>
              </div>
            </Section>
          ))
        )}
      </div>
    </div>
  );
}
