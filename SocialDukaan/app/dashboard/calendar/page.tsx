import TopNav from "@/components/layout/top-nav";
import ContentCalendar from "@/components/calendar/content-calendar";

export default function CalendarPage() {
  return (
    <>
      <TopNav title="Calendar" />
      <main className="flex-1 overflow-y-auto p-6">
        <ContentCalendar />
      </main>
    </>
  );
}
