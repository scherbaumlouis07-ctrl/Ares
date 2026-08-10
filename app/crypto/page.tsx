import { Section } from "@/components/ui/section";
import { IntelligencePanel } from "@/components/intelligence/intelligence-panel";
import { MarketChart } from "@/components/intelligence/market-chart";
import { getWeeklyCryptoSeries } from "@/lib/market-data";

const CRYPTO_ENTRIES = [
  {
    title: "BTC Netzwerkaktivität steigt",
    body: "Placeholder-Analyse: On-Chain-Aktivität und institutionelle Zuflüsse werden hier später zusammengefasst.",
  },
  {
    title: "ETH Layer-2 Wachstum",
    body: "Placeholder-Analyse: Entwicklungen im Layer-2-Ökosystem und Auswirkungen auf Gebühren und Adoption.",
  },
  {
    title: "SOL Ökosystem-Update",
    body: "Placeholder-Analyse: Netzwerkstabilität und neue Projekte im Solana-Ökosystem.",
  },
];

export default async function CryptoPage() {
  const [btc, sol, eth] = await Promise.all([
    getWeeklyCryptoSeries("btc"),
    getWeeklyCryptoSeries("sol"),
    getWeeklyCryptoSeries("eth"),
  ]);

  return (
    <div className="h-full flex p-4 gap-4">
      <Section title="Ares Crypto Intelligence" className="w-1/3 shrink-0">
        <IntelligencePanel
          heading="Krypto"
          entries={CRYPTO_ENTRIES}
          readAloudLabel="Ares Vorlesen"
        />
      </Section>

      <div className="w-2/3 flex flex-col gap-4 min-h-0">
        <Section title="Bitcoin" className="flex-1">
          <MarketChart label="BTC/USD" data={btc} />
        </Section>
        <Section title="Solana" className="flex-1">
          <MarketChart label="SOL/USD" data={sol} />
        </Section>
        <Section title="Ethereum" className="flex-1">
          <MarketChart label="ETH/USD" data={eth} />
        </Section>
      </div>
    </div>
  );
}
