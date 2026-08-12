import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BusinessMarketingPage() {
  return (
    <div className="relative h-full w-full bg-black">
      <Link
        href="/business"
        className="absolute left-4 top-4 text-text-secondary hover:text-text transition-colors"
        aria-label="Zurück"
      >
        <ArrowLeft size={20} />
      </Link>
    </div>
  );
}
