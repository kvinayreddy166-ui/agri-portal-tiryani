// Shared password policy for Edge Functions (Deno).
// Mirrors project/src/shared/lib/passwordPolicy.ts — keep both in sync.
// Only enforced when setting a NEW password; existing passwords are unaffected.

export const PASSWORD_MIN_LENGTH = 8;

export function isPasswordCompliant(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters and include a capital letter, a small letter, a number and a symbol.';
