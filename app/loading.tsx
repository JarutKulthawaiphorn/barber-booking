export default function RootLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
      <p
        className="text-[14px]"
        style={{ color: 'var(--color-muted)' }}
      >
        กำลังโหลด…
      </p>
    </main>
  );
}
