import TopNav from "@/components/layout/top-nav";
import ResearchPage from "@/components/research/research-page";

export default function Page() {
  return (
    <>
      <TopNav title="Research" />
      <main className="flex-1 overflow-y-auto p-6">
        <ResearchPage />
      </main>
    </>
  );
}
