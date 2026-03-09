import Sidebar from "@/components/layout/sidebar";
import DashboardGuard from "@/components/auth/dashboard-guard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardGuard>{children}</DashboardGuard>
      </div>
    </div>
  );
}
