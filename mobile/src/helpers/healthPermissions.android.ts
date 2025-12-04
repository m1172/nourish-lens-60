import GoogleFit, { Scopes } from 'react-native-google-fit';

import i18n from '../i18n';

import type { HealthPermissionResult } from './healthPermissions';

export async function requestHealthPermission(): Promise<HealthPermissionResult> {
  try {
    const authResult = await GoogleFit.authorize({
      scopes: [
        Scopes.FITNESS_ACTIVITY_READ,
        Scopes.FITNESS_ACTIVITY_WRITE,
        Scopes.FITNESS_BODY_READ,
        Scopes.FITNESS_NUTRITION_READ,
      ],
    });

    if (authResult.success) {
      return { granted: true };
    }

    return {
      granted: false,
      message:
        authResult.message || i18n.t('health.googleCancelled'),
    };
  } catch (error: any) {
    return Promise.reject(
      new Error(
        error?.message || i18n.t('health.googleError')
      )
    );
  }
}
