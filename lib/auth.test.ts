import { beforeEach, describe, expect, it } from 'vitest';

import { signAdminCookie, verifyAdminCredentials, verifyAdminCookie } from './auth';

const SECRET = 'a'.repeat(64);

describe('admin auth', () => {
  beforeEach(() => {
    process.env.ADMIN_COOKIE_SECRET = SECRET;
    process.env.ADMIN_1_USERNAME = 'barber1';
    process.env.ADMIN_1_PASSWORD = 'correct-horse-battery';
    process.env.ADMIN_2_USERNAME = 'barber2';
    process.env.ADMIN_2_PASSWORD = 'another-strong-pass';
    delete process.env.ADMIN_3_USERNAME;
    delete process.env.ADMIN_3_PASSWORD;
  });

  // --- verifyAdminCredentials ---

  it('accepts correct username + password for account 1', () => {
    expect(verifyAdminCredentials('barber1', 'correct-horse-battery')).toBe(true);
  });

  it('accepts correct username + password for account 2', () => {
    expect(verifyAdminCredentials('barber2', 'another-strong-pass')).toBe(true);
  });

  it('rejects correct password but wrong username', () => {
    expect(verifyAdminCredentials('barber2', 'correct-horse-battery')).toBe(false);
  });

  it('rejects correct username but wrong password', () => {
    expect(verifyAdminCredentials('barber1', 'wrong-password')).toBe(false);
  });

  it('rejects unknown username', () => {
    expect(verifyAdminCredentials('hacker', 'correct-horse-battery')).toBe(false);
  });

  it('rejects empty credentials', () => {
    expect(verifyAdminCredentials('', '')).toBe(false);
  });

  // --- signAdminCookie / verifyAdminCookie ---

  it('round-trips: sign then verify returns the username', () => {
    const cookie = signAdminCookie('barber1');
    expect(verifyAdminCookie(cookie)).toBe('barber1');
  });

  it('round-trips for the second username', () => {
    const cookie = signAdminCookie('barber2');
    expect(verifyAdminCookie(cookie)).toBe('barber2');
  });

  it('rejects a tampered token', () => {
    const cookie = signAdminCookie('barber1');
    const parts = cookie.split('.');
    parts[1] = (parts[1].startsWith('0') ? '1' : '0') + parts[1].slice(1);
    expect(verifyAdminCookie(parts.join('.'))).toBeNull();
  });

  it('rejects a tampered username', () => {
    const cookie = signAdminCookie('barber1');
    const parts = cookie.split('.');
    parts[0] = Buffer.from('hacker').toString('base64url');
    expect(verifyAdminCookie(parts.join('.'))).toBeNull();
  });

  it('rejects a cookie signed with a different secret', () => {
    const cookie = signAdminCookie('barber1');
    process.env.ADMIN_COOKIE_SECRET = 'b'.repeat(64);
    expect(verifyAdminCookie(cookie)).toBeNull();
  });

  it('rejects malformed input', () => {
    expect(verifyAdminCookie(undefined)).toBeNull();
    expect(verifyAdminCookie('')).toBeNull();
    expect(verifyAdminCookie('foo')).toBeNull();
    expect(verifyAdminCookie('foo.bar.baz')).toBeNull();
    expect(verifyAdminCookie('a.b')).toBeNull();
  });
});
