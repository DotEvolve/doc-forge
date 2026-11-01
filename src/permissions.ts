export const REPORT_TEMPLATES_MANAGE = 'report_templates:manage';

export interface ReportConfigPolicy {
  allowInAppCustomization?: boolean;
  allowedRolesForInAppCustomization?: string[];
}

export interface UserAuthContext {
  role?: string;
  permissions?: string[];
}

/**
 * Helper to normalize role strings across kebab-case, snake_case, and UPPERCASE
 * (e.g. 'SUPER_ADMIN' -> 'super-admin', 'tenant-admin' -> 'tenant-admin').
 */
export function normalizeRole(role?: string): string {
  return (role || '').trim().toLowerCase().replace(/_/g, '-');
}

/** Default administrative roles permitted to manage templates in Floorix */
export const DEFAULT_MANAGE_ROLES = [
  'super-admin',
  'tenant-admin',
  'tenant-owner',
  'admin',
  'owner',
];

/**
 * Evaluates whether current user has permission to open customization controls
 * and apply layout adjustments to their active print session.
 * Accessible to all authenticated users unless disabled by the tenant master switch.
 */
export function canCustomizeInAppTemplate(
  user?: UserAuthContext | null,
  reportConfig?: ReportConfigPolicy | null
): boolean {
  if (!user) return false;

  // 1. Master governance switch set by Admin
  if (reportConfig?.allowInAppCustomization === false) {
    return false;
  }

  // 2. Optional role whitelist (case-insensitive and separator-normalized)
  const allowedRoles = reportConfig?.allowedRolesForInAppCustomization;
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = normalizeRole(user.role);
    const normalizedWhitelist = allowedRoles.map(normalizeRole);
    return normalizedWhitelist.includes(userRole);
  }

  return true;
}

/**
 * Evaluates whether current user has permission to persist tenant-wide template defaults.
 * Restricted to superior administrative roles ('super-admin', 'tenant-admin', 'tenant-owner', 'admin', 'owner').
 */
export function canSaveTenantDefault(
  user?: UserAuthContext | null,
  reportConfig?: ReportConfigPolicy | null
): boolean {
  if (!user) return false;

  if (!canCustomizeInAppTemplate(user, reportConfig)) {
    return false;
  }

  const userRole = normalizeRole(user.role);

  // User permission check (with Floorix role fallback since client AuthUser has no permissions array)
  const hasManagePermission =
    user.permissions?.includes(REPORT_TEMPLATES_MANAGE) || DEFAULT_MANAGE_ROLES.includes(userRole);

  return hasManagePermission;
}
