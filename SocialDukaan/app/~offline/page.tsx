export default function OfflinePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-page-bg text-gray-800 px-6">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-2xl font-semibold">You are offline</h1>
        <p className="text-sm opacity-80">
          SocialDukaan is not reachable right now. Reconnect to the internet and retry.
        </p>
      </div>
    </main>
  );
}
