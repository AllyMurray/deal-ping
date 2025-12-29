import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatTimeAgo } from './time-format';

describe('formatTimeAgo', () => {
  beforeEach(() => {
    // Mock current time to 2024-06-15T12:00:00.000Z
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for timestamps less than a minute ago', () => {
    const timestamp = new Date('2024-06-15T11:59:30.000Z').toISOString();
    expect(formatTimeAgo(timestamp)).toBe('just now');
  });

  it('returns minutes ago for timestamps less than an hour ago', () => {
    expect(formatTimeAgo(new Date('2024-06-15T11:59:00.000Z').toISOString())).toBe('1 minute ago');
    expect(formatTimeAgo(new Date('2024-06-15T11:30:00.000Z').toISOString())).toBe('30 minutes ago');
    expect(formatTimeAgo(new Date('2024-06-15T11:01:00.000Z').toISOString())).toBe('59 minutes ago');
  });

  it('returns hours ago for timestamps less than a day ago', () => {
    expect(formatTimeAgo(new Date('2024-06-15T11:00:00.000Z').toISOString())).toBe('1 hour ago');
    expect(formatTimeAgo(new Date('2024-06-15T06:00:00.000Z').toISOString())).toBe('6 hours ago');
    expect(formatTimeAgo(new Date('2024-06-14T13:00:00.000Z').toISOString())).toBe('23 hours ago');
  });

  it('returns days ago for timestamps less than a week ago', () => {
    expect(formatTimeAgo(new Date('2024-06-14T12:00:00.000Z').toISOString())).toBe('1 day ago');
    expect(formatTimeAgo(new Date('2024-06-12T12:00:00.000Z').toISOString())).toBe('3 days ago');
    expect(formatTimeAgo(new Date('2024-06-09T12:00:00.000Z').toISOString())).toBe('6 days ago');
  });

  it('returns weeks ago for timestamps less than a month ago', () => {
    expect(formatTimeAgo(new Date('2024-06-08T12:00:00.000Z').toISOString())).toBe('1 week ago');
    expect(formatTimeAgo(new Date('2024-06-01T12:00:00.000Z').toISOString())).toBe('2 weeks ago');
    expect(formatTimeAgo(new Date('2024-05-18T12:00:00.000Z').toISOString())).toBe('4 weeks ago');
  });

  it('returns formatted date for timestamps more than a month ago (same year)', () => {
    const timestamp = new Date('2024-02-15T12:00:00.000Z').toISOString();
    expect(formatTimeAgo(timestamp)).toBe('15 Feb');
  });

  it('returns formatted date with year for timestamps from previous year', () => {
    const timestamp = new Date('2023-06-15T12:00:00.000Z').toISOString();
    expect(formatTimeAgo(timestamp)).toBe('15 Jun 2023');
  });
});
