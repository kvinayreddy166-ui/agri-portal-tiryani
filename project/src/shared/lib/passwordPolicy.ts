// Shared password policy for officer account creation and password reset.
// Enforced client-side for UX and server-side (Edge Functions) for security.
// Existing passwords are unaffected — this only applies when setting a new one.

export interface PasswordRule {
  id: 'length' | 'uppercase' | 'lowercase' | 'number' | 'symbol';
  labelEn: string;
  labelTe: string;
  test: (pw: string) => boolean;
}

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'length',
    labelEn: `At least ${PASSWORD_MIN_LENGTH} characters`,
    labelTe: `కనీసం ${PASSWORD_MIN_LENGTH} అక్షరాలు`,
    test: (pw) => pw.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: 'uppercase',
    labelEn: 'One capital letter (A-Z)',
    labelTe: 'కనీసం ఒక పెద్ద అక్షరం (A-Z)',
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    id: 'lowercase',
    labelEn: 'One small letter (a-z)',
    labelTe: 'కనీసం ఒక చిన్న అక్షరం (a-z)',
    test: (pw) => /[a-z]/.test(pw),
  },
  {
    id: 'number',
    labelEn: 'One number (0-9)',
    labelTe: 'కనీసం ఒక సంఖ్య (0-9)',
    test: (pw) => /[0-9]/.test(pw),
  },
  {
    id: 'symbol',
    labelEn: 'One symbol (!@#$%^&* etc.)',
    labelTe: 'కనీసం ఒక చిహ్నం (!@#$%^&* వంటివి)',
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
];

export function isPasswordCompliant(pw: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(pw));
}

export function getFailedPasswordRules(pw: string): PasswordRule[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(pw));
}

export function passwordPolicyErrorMessage(): string {
  return `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include a capital letter, a small letter, a number and a symbol.`;
}
