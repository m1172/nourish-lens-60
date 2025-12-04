import AppleHealthKit from 'react-native-health';
import type { HealthKitPermissions, AppleHealthKit as AppleHealthKitType } from 'react-native-health';

import i18n from '../i18n';

import type { HealthPermissionResult } from './healthPermissions';

type AppleHealthKitWithConstants = AppleHealthKitType & {
  Constants: { Permissions: Record<string, string> };
};

const HealthKit = AppleHealthKit as AppleHealthKitWithConstants;

const requireNativeModule = () => {
  return !!(HealthKit && typeof HealthKit.initHealthKit === 'function');
};

const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      HealthKit?.Constants?.Permissions?.StepCount,
      HealthKit?.Constants?.Permissions?.DistanceWalkingRunning,
      HealthKit?.Constants?.Permissions?.ActiveEnergyBurned,
      HealthKit?.Constants?.Permissions?.Weight,
      HealthKit?.Constants?.Permissions?.Water,
    ].filter(Boolean) as string[],
    write: [
      HealthKit?.Constants?.Permissions?.StepCount,
      HealthKit?.Constants?.Permissions?.DistanceWalkingRunning,
    ].filter(Boolean) as string[],
  },
};

export async function requestHealthPermission(): Promise<HealthPermissionResult> {
  if (!requireNativeModule()) {
    return {
      granted: false,
      message: i18n.t('health.appleUnavailable'),
    };
  }

  return new Promise((resolve, reject) => {
    const handleError = (message: string) =>
      reject(
        new Error(
          message || i18n.t('health.appleDenied')
        )
      );

    HealthKit.initHealthKit(permissions, (error) => {
      if (error) {
        handleError(typeof error === 'string' ? error : String(error));
        return;
      }

      HealthKit.isAvailable?.((err: unknown, available?: boolean) => {
        if (err || !available) {
          handleError(i18n.t('health.appleUnavailableDevice'));
          return;
        }

        resolve({ granted: true });
      });
    });
  });
}
