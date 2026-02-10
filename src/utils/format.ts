import type { FamilyGroup, Settings, TransactionUnit } from '../types';

/**
 * Format a raw minute count into a human-readable string (e.g. "2h 15m").
 * Always displays the absolute value — callers handle the +/- sign.
 */
export const formatMinutes = (minutes: number): string => {
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;

  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${m}m`;
};

/** Format an amount with the correct unit label. */
export const formatAmount = (amount: number, unit: TransactionUnit): string => {
  if (unit === 'points') {
    return `${Math.abs(amount)} pts`;
  }
  return formatMinutes(amount);
};

/**
 * Look up a display name and color for a given childId.
 * Checks family members first, then falls back to settings.children
 * for backward compatibility with older data.
 */
export const getPersonInfo = (
  childId: string,
  family: FamilyGroup | null,
  settings: Settings | null,
): { name: string; color: string } => {
  if (family) {
    const member = Object.values(family.members).find(m => m.childId === childId);
    if (member) {
      return {
        name: member.displayName,
        color: member.color || '#6b7280',
      };
    }
  }

  const person = settings?.children.find(c => c.id === childId);
  return {
    name: person?.name || 'Unknown',
    color: person?.color || '#6b7280',
  };
};
