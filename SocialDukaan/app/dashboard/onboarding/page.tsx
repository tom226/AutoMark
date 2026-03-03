import TopNav from "@/components/layout/top-nav";
import OnboardingPage from "@/components/onboarding/onboarding-page";

export default function Page() {
  return (
    <>
      <TopNav title="Connect Accounts" />
      <main className="flex-1 overflow-y-auto p-6">
        <OnboardingPage />
      </main>
    </>
  );
}
