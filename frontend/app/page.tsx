import { CryptoSection } from "@/components/CryptoSection";
import { FxSection } from "@/components/FxSection";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { StockSection } from "@/components/StockSection";
import { SummaryBanner } from "@/components/SummaryBanner";
import { Watchlist } from "@/components/Watchlist";

export default function DashboardPage() {
  return (
    <div>
      <Header />
      <main className="animate-in mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <Sidebar />
        <div className="min-w-0 flex-1 space-y-10">
          <SummaryBanner />
          <Watchlist />
          <StockSection />
          <FxSection />
          <CryptoSection />
        </div>
      </main>
    </div>
  );
}
