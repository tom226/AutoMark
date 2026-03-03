import TopNav from "@/components/layout/top-nav";
import CompetitorsPage from "@/components/competitors/competitors-page";

export default function Page() {
  return (
    <>
      <TopNav title="Competitor Intelligence" />
      <main className="flex-1 overflow-y-auto p-6">
        <CompetitorsPage />
      </main>
    </>
  );
}
