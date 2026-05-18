/**
 * Root loading UI — shown during route segment transitions while the next
 * server component renders. Keep this lightweight; it's the first paint users
 * see during navigation.
 */
export default function RootLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="tracking-mark text-xs text-brass">One moment</p>
      <p className="font-display mt-4 text-3xl text-ink italic">Pulling the chair…</p>
    </main>
  );
}
