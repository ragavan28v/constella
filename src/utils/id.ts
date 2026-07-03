export function generateId(): string {
  // Use crypto.randomUUID() if available, else a secure random string fallback
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').substring(0, 12);
  }
  return Math.random().toString(36).substring(2, 15);
}
