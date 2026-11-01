import { describe, it, expect } from 'vitest';
import { canCustomizeInAppTemplate, canSaveTenantDefault } from '../permissions';

describe('DocForge Governance & Permissions', () => {
  it('allows customization by default for authenticated users', () => {
    expect(canCustomizeInAppTemplate({ role: 'user' })).toBe(true);
    expect(canCustomizeInAppTemplate({ role: 'admin' })).toBe(true);
    expect(canCustomizeInAppTemplate(null)).toBe(false);
  });

  it('respects master switch in reportConfig policy', () => {
    expect(canCustomizeInAppTemplate({ role: 'admin' }, { allowInAppCustomization: false })).toBe(
      false
    );
  });

  it('respects role whitelist in reportConfig policy with normalized case', () => {
    const policy = { allowedRolesForInAppCustomization: ['tenant-admin', 'super-admin'] };
    expect(canCustomizeInAppTemplate({ role: 'TENANT_ADMIN' }, policy)).toBe(true);
    expect(canCustomizeInAppTemplate({ role: 'super-admin' }, policy)).toBe(true);
    expect(canCustomizeInAppTemplate({ role: 'operator' }, policy)).toBe(false);
  });

  it('allows tenant administrators to manage defaults', () => {
    expect(canSaveTenantDefault({ role: 'tenant-admin' })).toBe(true);
    expect(canSaveTenantDefault({ role: 'super-admin' })).toBe(true);
    expect(canSaveTenantDefault({ role: 'operator' })).toBe(false);
    expect(canSaveTenantDefault(null)).toBe(false);
  });
});
