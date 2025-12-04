import i18n from '../i18n';

export type HealthPermissionResult = {
  granted: boolean;
  message?: string;
};

/**
 * Fallback implementation used for platforms without a native health integration
 * (e.g. web). Native builds will use the platform-specific files instead.
 */
export async function requestHealthPermission(): Promise<HealthPermissionResult> {
  return {
    granted: false,
    message: i18n.t('health.unavailable'),
  };
}
