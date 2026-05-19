'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled route error:', error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
      <h1 className="text-[22px] font-semibold">เกิดข้อผิดพลาด</h1>
      <p
        className="mt-2 text-[14px]"
        style={{ color: 'var(--color-muted)' }}
      >
        กรุณาลองใหม่อีกครั้ง
      </p>
      {error.digest ? (
        <p
          className="mt-2 mono text-[12px]"
          style={{ color: 'var(--color-muted)' }}
        >
          อ้างอิง: {error.digest}
        </p>
      ) : null}

      <div className="mt-6 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
        <button type="button" onClick={reset} className="btn btn-primary">
          ลองอีกครั้ง
        </button>
        <Link href="/" className="btn btn-secondary">
          กลับหน้าหลัก
        </Link>
      </div>
    </main>
  );
}
