import type { Role } from '../types';

/**
 * Returns the primary dashboard route for a given user role.
 * Ensures consistent routing across home header, auth guards, and session restoration.
 */
export function getDashboardRouteForRole(role?: Role | null): string {
  switch (role) {
    case 'PATIENT':
      return '/(patient)';
    case 'DOCTOR':
      return '/(doctor)';
    case 'CLINIC':
      return '/(clinic)';
    case 'RECEPTIONIST':
      return '/(receptionist)';
    case 'DIAGNOSTIC_CENTER':
      return '/(diagnosticCenter)';
    case 'DIAGNOSTIC_STAFF':
      return '/(diagnosticStaff)';
    case 'SUPER_ADMIN':
      return '/(superAdmin)';
    case 'ADMIN':
      return '/(admin)';
    default:
      return '/(patient)';
  }
}

/**
 * Human-readable role display name for badges and UI.
 */
export function getRoleDisplayName(role?: Role | null): string {
  switch (role) {
    case 'PATIENT':
      return 'Patient';
    case 'DOCTOR':
      return 'Doctor';
    case 'CLINIC':
      return 'Clinic';
    case 'RECEPTIONIST':
      return 'Receptionist';
    case 'DIAGNOSTIC_CENTER':
      return 'Diagnostic Center';
    case 'DIAGNOSTIC_STAFF':
      return 'Diagnostic Staff';
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'ADMIN':
      return 'Admin';
    default:
      return 'Member';
  }
}
