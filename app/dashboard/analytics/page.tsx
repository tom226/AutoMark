import TopNav from "@/components/layout/top-nav";
import AnalyticsPage from "@/components/analytics/analytics-page";

export default function AnalyticsRoute() {
  return (
    <>
      <TopNav title="Analytics" />
      <main className="flex-1 overflow-y-auto p-6">
        <AnalyticsPage />
      </main>
    </>
  );
}
