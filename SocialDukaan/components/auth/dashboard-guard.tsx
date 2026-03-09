"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface OnboardingResponse {
  profile?: {
    onboardingCompleted?: boolean;
  };
}

export default function DashboardGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      const isOnboardingRoute = pathname === "/dashboard/onboarding";
      try {
        const res = await fetch("/api/onboarding", { cache: "no-store" });
        const data = (await res.json()) as OnboardingResponse;
        const completed = Boolean(data?.profile?.onboardingCompleted);

        if (!active) return;

        if (!completed && !isOnboardingRoute) {
          router.replace("/dashboard/onboarding");
          return;
        }

        if (completed && isOnboardingRoute) {
          setChecking(false);
          return;
        }

        setChecking(false);
      } catch {
        if (!active) return;
        if (pathname !== "/dashboard/onboarding") {
          router.replace("/dashboard/onboarding");
          return;
        }
        setChecking(false);
      }
    }

    checkAccess();
    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (checking && pathname !== "/dashboard/onboarding") {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        Checking account setup...
      </div>
    );
  }

  return <>{children}</>;
}
