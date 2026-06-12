const normalizeRole = (role: unknown) =>
  typeof role === 'string' ? role.replace(/^ROLE_/, '').toUpperCase() : '';

const collectRoleValues = (value: unknown): string[] => {
  if (!value) return [];

  if (typeof value === 'string') {
    return value.split(/[\s,]+/).filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectRoleValues(item));
  }

  if (typeof value === 'object') {
    const roleObject = value as Record<string, unknown>;
    return collectRoleValues(
      roleObject.authority ?? roleObject.role ?? roleObject.name ?? '',
    );
  }

  return [];
};

export const hasAdminRole = (role: unknown) => normalizeRole(role) === 'ADMIN';

export const tokenHasAdminRole = (accessToken: string | null) => {
  if (!accessToken) return false;

  const [, payload] = accessToken.split('.');
  if (!payload) return false;

  try {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      '=',
    );
    const decodedPayload = JSON.parse(window.atob(paddedPayload)) as Record<
      string,
      unknown
    >;
    const roleValues = [
      ...collectRoleValues(decodedPayload.role),
      ...collectRoleValues(decodedPayload.roles),
      ...collectRoleValues(decodedPayload.authorities),
      ...collectRoleValues(decodedPayload.auth),
      ...collectRoleValues(decodedPayload.scope),
      ...collectRoleValues(decodedPayload.scopes),
    ];

    return roleValues.some(hasAdminRole);
  } catch {
    return false;
  }
};
