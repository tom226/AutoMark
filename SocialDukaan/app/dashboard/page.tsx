import TopNav from "@/components/layout/top-nav";
import OverviewPage from "@/components/dashboard/overview-page";

export default function DashboardPage() {
  return (
    <>
      <TopNav title="Overview" />
      <main className="flex-1 overflow-y-auto p-6">
        <OverviewPage />
      </main>
    </>
  );
}

