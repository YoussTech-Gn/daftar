import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { scheduleDailySummary, sendTestNotification } from '@/lib/notifications';

jest.mock('expo-notifications', () => ({
  __esModule: true,
  scheduleNotificationAsync: jest.fn(async () => 'id'),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  getPermissionsAsync: jest.fn(async () => ({ granted: true, status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true, status: 'granted' })),
  setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationHandler: jest.fn(),
  AndroidImportance: { DEFAULT: 5 },
  IosAuthorizationStatus: { PROVISIONAL: 2 },
  SchedulableTriggerInputTypes: { DAILY: 'daily', TIME_INTERVAL: 'timeInterval' },
}));

jest.mock('@/db/repository', () => ({
  getSummary: jest.fn(async () => ({
    totalOwed: 100_000,
    customersInDebt: 1,
    creditToday: 0,
    paymentsToday: 0,
  })),
  listDebtAges: jest.fn(async () => [{ sinceAt: Date.now() - 40 * 86_400_000 }]),
}));

jest.mock('@/domain/currency', () => ({
  formatAmount: (n: number) => `${n} FCFA`,
}));

const scheduleNotificationAsync = Notifications.scheduleNotificationAsync as jest.MockedFunction<
  typeof Notifications.scheduleNotificationAsync
>;
const cancelScheduledNotificationAsync =
  Notifications.cancelScheduledNotificationAsync as jest.MockedFunction<
    typeof Notifications.cancelScheduledNotificationAsync
  >;
const setNotificationChannelAsync = Notifications.setNotificationChannelAsync as jest.MockedFunction<
  typeof Notifications.setNotificationChannelAsync
>;

describe('scheduleDailySummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'android' });
  });

  it('cancels when disabled', async () => {
    const result = await scheduleDailySummary({
      db: {} as never,
      enabled: false,
      hour: 20,
      language: 'fr',
      currency: 'XOF',
    });
    expect(result).toBe('disabled');
    expect(cancelScheduledNotificationAsync).toHaveBeenCalled();
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules a DAILY trigger with channelId on the trigger', async () => {
    const result = await scheduleDailySummary({
      db: {} as never,
      enabled: true,
      hour: 20,
      language: 'fr',
      currency: 'XOF',
    });
    expect(result).toBe('scheduled');
    expect(setNotificationChannelAsync).toHaveBeenCalled();
    expect(scheduleNotificationAsync).toHaveBeenCalled();
    const arg = scheduleNotificationAsync.mock.calls[0]?.[0] as {
      identifier?: string;
      content: { channelId?: string; body: string };
      trigger: { type: string; hour: number; minute: number; channelId: string };
    };
    expect(arg.identifier).toBe('daftar-daily-summary');
    expect(arg.trigger).toEqual(
      expect.objectContaining({
        type: 'daily',
        hour: 20,
        minute: 0,
        channelId: 'daftar-daily-summary',
      }),
    );
    expect(arg.content.channelId).toBeUndefined();
    expect(arg.content.body).toContain('1');
  });

  it('sends a 2-second test notification', async () => {
    const result = await sendTestNotification({
      db: {} as never,
      language: 'en',
      currency: 'XOF',
    });
    expect(result).toBe('sent');
    const arg = scheduleNotificationAsync.mock.calls[0]?.[0] as {
      trigger: { type: string; seconds: number };
    };
    expect(arg.trigger).toEqual(expect.objectContaining({ type: 'timeInterval', seconds: 2 }));
  });
});
