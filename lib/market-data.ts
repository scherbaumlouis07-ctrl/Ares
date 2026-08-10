import { createClient } from "@/lib/supabase/server";
import { WEEKDAYS_SHORT_DE } from "@/lib/constants";
import type { PricePoint } from "@/lib/mock-data";

/**
 * Live crypto prices via CoinGecko's free public API (no key required —
 * keeps this simple to turn on). Prices are cached in the existing
 * `metrics` table (metric_key = "price_<symbol>") so repeated page loads
 * don't hammer the API and so real price history accumulates over time.
 */

export type CryptoSymbol = "btc" | "eth" | "sol";

const COINGECKO_IDS: Record<CryptoSymbol, string> = {
  btc: "bitcoin",
  eth: "ethereum",
  sol: "solana",
};

const CACHE_FRESH_MS = 6 * 60 * 60 * 1000; // 6 hours

function metricKeyFor(symbol: CryptoSymbol): string {
  return `price_${symbol}`;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** One price point per calendar day (the last observation of that day) for the last 7 days. */
function toLastPerDay(points: { timestamp: number; price: number }[]): Map<string, number> {
  const byDay = new Map<string, number>();
  points.forEach(({ timestamp, price }) => {
    const key = dayKey(new Date(timestamp));
    byDay.set(key, price); // later points overwrite earlier ones for the same day
  });
  return byDay;
}

async function fetchLiveSeries(symbol: CryptoSymbol): Promise<{ timestamp: number; price: number }[]> {
  const id = COINGECKO_IDS[symbol];
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`CoinGecko-Anfrage fehlgeschlagen (${res.status})`);

  const json = (await res.json()) as { prices: [number, number][] };
  return (json.prices ?? []).map(([timestamp, price]) => ({ timestamp, price }));
}

function last7DayKeys(): string[] {
  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(dayKey(d));
  }
  return keys;
}

function toChartPoints(byDay: Map<string, number>): PricePoint[] {
  return last7DayKeys().map((key) => {
    const [, month, day] = key.split("-").map(Number);
    const weekdayIndex = (new Date(key).getDay() + 6) % 7; // 0 = Monday
    return {
      label: WEEKDAYS_SHORT_DE[weekdayIndex] ?? `${day}.${month}.`,
      value: Math.round(byDay.get(key) ?? 0),
    };
  });
}

/**
 * Returns 7 daily price points (oldest → today) for the given symbol,
 * refreshing from CoinGecko only when the cache is missing or stale.
 */
export async function getWeeklyCryptoSeries(symbol: CryptoSymbol): Promise<PricePoint[]> {
  const supabase = await createClient();
  const metricKey = metricKeyFor(symbol);

  const { data: latestRow } = await supabase
    .from("metrics")
    .select("recorded_at")
    .eq("metric_key", metricKey)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isStale =
    !latestRow || Date.now() - new Date(latestRow.recorded_at).getTime() > CACHE_FRESH_MS;

  if (isStale) {
    try {
      const live = await fetchLiveSeries(symbol);
      if (live.length > 0) {
        const rows = live.map(({ timestamp, price }) => ({
          metric_key: metricKey,
          value: price,
          recorded_at: new Date(timestamp).toISOString(),
        }));
        await supabase.from("metrics").insert(rows);
      }
    } catch (error) {
      // Fall through to whatever is already cached — a failed refresh
      // shouldn't break the chart if we have older data to show.
      console.error(`Crypto-Preisabruf für ${symbol} fehlgeschlagen:`, error);
    }
  }

  const { data: cachedRows, error } = await supabase
    .from("metrics")
    .select("value, recorded_at")
    .eq("metric_key", metricKey)
    .gte("recorded_at", new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString())
    .order("recorded_at", { ascending: true });

  if (error || !cachedRows) return toChartPoints(new Map());

  const byDay = toLastPerDay(
    cachedRows.map((row) => ({ timestamp: new Date(row.recorded_at).getTime(), price: Number(row.value) }))
  );
  return toChartPoints(byDay);
}
