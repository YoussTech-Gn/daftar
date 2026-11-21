import * as LocalAuthentication from 'expo-local-authentication';

/** True when the phone has a fingerprint / face sensor with at least one enrolled finger or face. */
export async function canUseBiometrics(): Promise<boolean> {
  try {
    const [hardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hardware && enrolled;
  } catch {
    return false;
  }
}

/**
 * Quick unlock with the phone's own biometrics (decision 0018). The PIN stays the real key:
 * biometrics only skip typing it, and the PIN pad is always there as the fallback.
 */
export async function unlockWithBiometrics(promptMessage: string, cancelLabel: string): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel,
      disableDeviceFallback: true,
    });
    return result.success;
  } catch {
    return false;
  }
}
