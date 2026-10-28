const KEY = 'erp_voice_privacy_accepted_v1';

export function hasAcceptedPrivacy(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function acceptPrivacy(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    // ignore
  }
}

export function clearPrivacy(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
