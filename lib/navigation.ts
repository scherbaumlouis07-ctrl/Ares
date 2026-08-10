import {
  AudioWaveform,
  LayoutDashboard,
  ListChecks,
  Briefcase,
  Activity,
  Bitcoin,
  CandlestickChart,
  NotebookPen,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Ares", href: "/ares", icon: AudioWaveform },
  { label: "Persönliches Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Heutige Aufgaben", href: "/today", icon: ListChecks },
  { label: "Business", href: "/business", icon: Briefcase },
  { label: "Gesundheit", href: "/health", icon: Activity },
  { label: "Krypto", href: "/crypto", icon: Bitcoin },
  { label: "Investments", href: "/investments", icon: CandlestickChart },
  { label: "Journal", href: "/journal", icon: NotebookPen },
];
