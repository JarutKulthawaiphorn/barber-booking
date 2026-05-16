import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const ADMIN_COOKIE_NAME = 'admin_session';
export const ADMIN_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

const HEX_64 = /^[0-9a-f]{64}$/;

// ---------------------------------------------------------------------------
// Env helpers
// ---------------------------------------------------------------------------

function requireCookieSecret(): string {
  const s = process.env.ADMIN_COOKIE_SECRET;
  if (!s || s.length < 64) {
    throw new Error('ADMIN_COOKIE_SECRET must be set and at least 64 hex chars');
  }
  return s;
}

/**
 * Load all admin accounts from env.
 * Pattern: ADMIN_1_USERNAME / ADMIN_1_PASSWORD, ADMIN_2_USERNAME / ADMIN_2_PASSWORD, …
 */
function loadAdminAccounts(): Array<{ username: string; password: string }> {
  const accounts: Array<{ username: string; password: string }> = [];
  let i = 1;
  while (true) {
    const username = process.env[`ADMIN_${i}_USERNAME`];
    const password = process.env[`ADMIN_${i}_PASSWORD`];
    if (!username || !password) break;
    accounts.push({ username, password });
    i++;
  }
  if (accounts.length === 0) {
    throw new Error(
      'No admin accounts configured — set ADMIN_1_USERNAME and ADMIN_1_PASSWORD in .env.local',
    );
  }
  return accounts;
}

// ---------------------------------------------------------------------------
// Credentials verification
// ---------------------------------------------------------------------------

/**
 * Verify a username + password pair against all configured admin accounts.
 * Returns true only when both the username matches and the password matches
 * (constant-time comparison on the password).
 *
 * The error message shown to the user must NOT distinguish "wrong username"
 * from "wrong password" to avoid username enumeration.
 */
export function verifyAdminCredentials(username: string, password: string): boolean {
  const accounts = loadAdminAccounts();
  const account = accounts.find((a) => a.username === username);
  if (!account) return false;

  const a = Buffer.from(password);
  const b = Buffer.from(account.password);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// ---------------------------------------------------------------------------
// Cookie  (structure: <usernameB64>.<token>.<hmac-of-usernameB64+"."+token>)
// ---------------------------------------------------------------------------

/**
 * Create a signed session cookie value that embeds the given username.
 */
export function signAdminCookie(username: string): string {
  const token = randomBytes(32).toString('hex');
  const usernameB64 = Buffer.from(username).toString('base64url');
  const payload = `${usernameB64}.${token}`;
  const hmac = createHmac('sha256', requireCookieSecret()).update(payload).digest('hex');
  return `${payload}.${hmac}`;
}

/**
 * Verify a session cookie value.
 * Returns the embedded username on success, or null on any failure.
 */
export function verifyAdminCookie(value: string | undefined): string | null {
  if (!value) return null;

  const parts = value.split('.');
  if (parts.length !== 3) return null;

  const [usernameB64, token, providedHmac] = parts;

  if (!HEX_64.test(token) || !HEX_64.test(providedHmac)) return null;

  const payload = `${usernameB64}.${token}`;
  const expectedHmac = createHmac('sha256', requireCookieSecret()).update(payload).digest();
  const providedBuf = Buffer.from(providedHmac, 'hex');

  if (providedBuf.length !== expectedHmac.length) return null;
  if (!timingSafeEqual(providedBuf, expectedHmac)) return null;

  try {
    return Buffer.from(usernameB64, 'base64url').toString('utf8');
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Session helpers for server components / actions
// ---------------------------------------------------------------------------

/**
 * Returns the signed-in admin's username, or null if not authenticated.
 */
export async function getAdminSession(): Promise<string | null> {
  const cookieStore = await cookies();
  return verifyAdminCookie(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

/**
 * Enforces admin authentication.
 * Redirects to /admin/login if not signed in; returns the username otherwise.
 */
export async function requireAdmin(): Promise<string> {
  const username = await getAdminSession();
  if (!username) redirect('/admin/login');
  return username;
}
