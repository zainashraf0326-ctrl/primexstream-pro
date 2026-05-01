export const PASSWORD_REQUIREMENTS = [
  { key: 'minLength', label: '8+ characters' },
  { key: 'uppercase', label: 'Uppercase letter' },
  { key: 'lowercase', label: 'Lowercase letter' },
  { key: 'number', label: 'Number' },
  { key: 'symbol', label: 'Symbol' },
] as const;

export type PasswordRequirementKey = (typeof PASSWORD_REQUIREMENTS)[number]['key'];

export interface PasswordStrength {
  checks: Record<PasswordRequirementKey, boolean>;
  score: number;
  label: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
  isValid: boolean;
}

export function getPasswordStrength(password: string): PasswordStrength {
  const checks: Record<PasswordRequirementKey, boolean> = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  if (score <= 1) {
    return { checks, score, label: 'Weak', isValid: false };
  }

  if (score === 2) {
    return { checks, score, label: 'Fair', isValid: false };
  }

  if (score === 3) {
    return { checks, score, label: 'Good', isValid: false };
  }

  if (score === 4) {
    return { checks, score, label: 'Strong', isValid: false };
  }

  return { checks, score, label: 'Very Strong', isValid: true };
}
