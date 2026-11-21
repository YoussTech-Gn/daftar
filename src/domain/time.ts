/** Whole calendar days between a timestamp and now (0 = today, 1 = yesterday). */
export function daysAgo(timestamp: number, now: number = Date.now()): number {
  const start = (ms: number) => {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  return Math.max(0, Math.round((start(now) - start(timestamp)) / 86_400_000));
}
