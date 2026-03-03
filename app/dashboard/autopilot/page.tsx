import TopNav from "@/components/layout/top-nav";
import AutopilotPage from "@/components/autopilot/autopilot-page";

export default function Page() {
  return (
    <>
      <TopNav title="Autopilot" />
      <main className="flex-1 overflow-y-auto p-6">
        <AutopilotPage />
      </main>
    </>
  );
}
