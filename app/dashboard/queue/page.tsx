import TopNav from "@/components/layout/top-nav";
import PostQueue from "@/components/queue/post-queue";

export default function QueuePage() {
  return (
    <>
      <TopNav title="Queue" />
      <main className="flex-1 overflow-y-auto p-6">
        <PostQueue />
      </main>
    </>
  );
}
