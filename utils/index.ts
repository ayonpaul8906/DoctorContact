/**
 * Format initials from a full name.
 * Mirrored from Web DoctorCard initials logic.
 */
export function formatInitials(name?: string | null): string {
  if (!name) return 'DC';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Format currency in INR (₹).
 */
export function formatCurrency(amount?: number | null): string {
  if (amount == null) return '₹0';
  return `₹${amount.toLocaleString('en-IN')}`;
}
