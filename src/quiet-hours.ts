import type { AllowedUser } from './db/schemas';

/**
 * Quiet hours utility functions.
 *
 * Quiet hours allow users to specify a time range during which notifications
 * should not be sent. Instead, deals are queued and sent when quiet hours end.
 *
 * Time is stored in HH:mm format (24-hour) with a timezone.
 * Quiet hours can span midnight (e.g., 22:00 - 08:00).
 *
 * Quiet hours are now an account-level setting (stored on AllowedUser),
 * not per-channel, for better UX.
 */

/**
 * Interface for entities with quiet hours settings
 */
export interface QuietHoursConfig {
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  quietHoursTimezone?: string;
}

/**
 * Parse a time string (HH:mm) into minutes since midnight
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Get the current time in a specific timezone as minutes since midnight
 */
export function getCurrentTimeInTimezone(timezone: string): number {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);

  return hour * 60 + minute;
}

/**
 * Check if the current time is within quiet hours for a user.
 *
 * Handles cases where quiet hours span midnight (e.g., 22:00 - 08:00).
 *
 * @param config - An entity with quiet hours settings (AllowedUser)
 * @returns true if currently within quiet hours, false otherwise
 */
export function isWithinQuietHours(config: QuietHoursConfig): boolean {
  // If quiet hours not enabled or times not set, not in quiet hours
  if (!config.quietHoursEnabled || !config.quietHoursStart || !config.quietHoursEnd) {
    return false;
  }

  const timezone = config.quietHoursTimezone ?? 'UTC';
  const currentMinutes = getCurrentTimeInTimezone(timezone);
  const startMinutes = parseTimeToMinutes(config.quietHoursStart);
  const endMinutes = parseTimeToMinutes(config.quietHoursEnd);

  // Check if quiet hours span midnight
  if (startMinutes > endMinutes) {
    // Spans midnight: 22:00 - 08:00 means quiet from 22:00 to 23:59 and 00:00 to 08:00
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } else {
    // Same day: 01:00 - 06:00 means quiet from 01:00 to 06:00
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
}

/**
 * Check if quiet hours just ended (within the last N minutes).
 *
 * This is used to determine when to send queued deals.
 * We check if we're within the first few minutes after quiet hours ended.
 *
 * @param config - An entity with quiet hours settings (AllowedUser)
 * @param windowMinutes - How many minutes after quiet hours end to consider "just ended" (default: 2)
 * @returns true if quiet hours just ended, false otherwise
 */
export function didQuietHoursJustEnd(config: QuietHoursConfig, windowMinutes: number = 2): boolean {
  // If quiet hours not enabled or times not set, didn't just end
  if (!config.quietHoursEnabled || !config.quietHoursStart || !config.quietHoursEnd) {
    return false;
  }

  const timezone = config.quietHoursTimezone ?? 'UTC';
  const currentMinutes = getCurrentTimeInTimezone(timezone);
  const endMinutes = parseTimeToMinutes(config.quietHoursEnd);

  // Check if we're within the window after quiet hours end
  // Account for midnight wrap-around
  const minutesSinceEnd = (currentMinutes - endMinutes + 1440) % 1440;

  return minutesSinceEnd >= 0 && minutesSinceEnd < windowMinutes;
}

/**
 * Get a human-readable description of quiet hours for display
 */
export function formatQuietHours(config: QuietHoursConfig): string | null {
  if (!config.quietHoursEnabled || !config.quietHoursStart || !config.quietHoursEnd) {
    return null;
  }

  const timezone = config.quietHoursTimezone ?? 'UTC';
  // Format timezone for display (e.g., "Europe/London" -> "London")
  const shortTimezone = timezone.split('/').pop() ?? timezone;

  return `${config.quietHoursStart} - ${config.quietHoursEnd} (${shortTimezone})`;
}

/**
 * Validate quiet hours configuration
 */
export function validateQuietHours(
  start?: string,
  end?: string
): { valid: boolean; error?: string } {
  if (!start && !end) {
    return { valid: true }; // Both empty is valid (disabled)
  }

  if (!start || !end) {
    return { valid: false, error: 'Both start and end times are required' };
  }

  // Validate format (HH:mm)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (!timeRegex.test(start)) {
    return { valid: false, error: 'Start time must be in HH:mm format (00:00 - 23:59)' };
  }

  if (!timeRegex.test(end)) {
    return { valid: false, error: 'End time must be in HH:mm format (00:00 - 23:59)' };
  }

  // Start and end can be the same only if both are the same time (effectively disabled)
  // This is intentionally allowed

  return { valid: true };
}

/**
 * Common timezone options for the UI
 */
export const TIMEZONE_OPTIONS = [
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)' },
  { value: 'Europe/Dublin', label: 'Dublin (GMT/IST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'UTC', label: 'UTC' },
];
