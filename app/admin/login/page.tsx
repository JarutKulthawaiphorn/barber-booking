import { loginAction } from './actions';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Username and password are required.',
  invalid: 'Invalid username or password.',
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error ? (ERROR_MESSAGES[params.error] ?? 'Login failed.') : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
      <form
        action={loginAction}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
      >
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Admin sign-in</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Enter your username and password to manage shop settings.
        </p>

        <label className="mt-6 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Username
          <input
            type="text"
            name="username"
            required
            autoComplete="username"
            autoCapitalize="off"
            spellCheck={false}
            className="mt-2 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Password
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="mt-2 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </label>

        {error ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="mt-6 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
