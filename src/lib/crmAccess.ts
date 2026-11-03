export const CRM_WORKSPACE = 'elisam';
export type CrmScope = 'insurance' | 'rent';
export function isCrmStaff(user: { app_metadata?: Record<string, unknown> } | null | undefined, scope: CrmScope = 'insurance'): boolean {
  const meta = user?.app_metadata;
  return meta?.crm_workspace === CRM_WORKSPACE && meta.crm_staff === true && meta.crm_disabled !== true &&
    (meta.crm_role === 'admin' || (Array.isArray(meta.crm_scopes) ? meta.crm_scopes.includes(scope) : scope === 'insurance'));
}
export function isCrmAdmin(user: { app_metadata?: Record<string, unknown> } | null | undefined): boolean {
  return isCrmStaff(user) && user?.app_metadata?.crm_role === 'admin';
}
