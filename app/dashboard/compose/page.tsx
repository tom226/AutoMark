import TopNav from "@/components/layout/top-nav";
import ComposeForm from "@/components/compose/compose-form";

export default function ComposePage() {
  return (
    <>
      <TopNav title="Compose" />
      <main className="flex-1 overflow-y-auto p-6">
        <ComposeForm />
      </main>
    </>
  );
}
