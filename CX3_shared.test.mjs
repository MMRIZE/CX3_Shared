import { test } from 'node:test';
import assert from 'node:assert';
import { getWeekNo, prepareEvents, regularizeEvents } from './CX3_shared.mjs';

/**
 * Tests for date/timezone handling in formatEvents
 * Related to PR #19: https://github.com/MMRIZE/CX3_Shared/pull/19
 */

test('event.today flag uses local date comparison correctly', () => {
  // This test verifies the fix works regardless of system timezone
  // by using times that are clearly on the same day in any reasonable timezone

  const now = new Date('2026-01-26T12:00:00Z'); // Noon UTC
  const originalDate = global.Date;

  // Mock Date constructor to return our fixed time for "new Date()"
  global.Date = class extends originalDate {
    constructor(...args) {
      if (args.length === 0) {
        return now;
      }
      return new originalDate(...args);
    }
    static now() {
      return now.getTime();
    }
  };

  try {
    // Events clearly on same day (noon) and different day (2 days later)
    const sameDayEvent = {
      title: 'Same Day Event',
      startDate: new Date('2026-01-26T14:00:00Z').getTime(), // Same day, 2 hours later
      endDate: new Date('2026-01-26T15:00:00Z').getTime(),
      fullDayEvent: false,
      calendarSeq: 1
    };

    const differentDayEvent = {
      title: 'Different Day Event',
      startDate: new Date('2026-01-28T12:00:00Z').getTime(), // 2 days later
      endDate: new Date('2026-01-28T13:00:00Z').getTime(),
      fullDayEvent: false,
      calendarSeq: 2
    };

    const config = {
      calendarSet: [],
      maxItems: 100,
      maxDays: 90
    };

    const eventPool = new Map();
    eventPool.set('test-calendar', [sameDayEvent, differentDayEvent]);

    const regularized = regularizeEvents({ eventPool, config });
    const prepared = prepareEvents({
      targetEvents: regularized,
      config,
      range: { from: now.getTime(), to: now.getTime() + 7 * 24 * 60 * 60 * 1000 }
    });

    const sameDay = prepared.find(e => e.title === 'Same Day Event');
    const differentDay = prepared.find(e => e.title === 'Different Day Event');

    // With local date comparison, same day event should be marked as "today"
    assert.strictEqual(
      sameDay.today,
      true,
      'Event on the same local day should be marked as today'
    );

    // Event 2 days in the future should NOT be today
    assert.strictEqual(
      differentDay.today,
      false,
      'Event on a different day should NOT be marked as today'
    );
  } finally {
    // Restore original Date
    global.Date = originalDate;
  }
});

test('fullday events should have correct "today" flag across timezones', () => {
  // Fullday events have special handling in formatEvents (lines 366-371)
  // Test if the "today" flag is correct for fullday events

  const now = new Date('2026-01-26T22:00:00Z'); // 22:00 UTC = 23:00 CET (Jan 26)
  const originalDate = global.Date;

  global.Date = class extends originalDate {
    constructor(...args) {
      if (args.length === 0) {
        return now;
      }
      return new originalDate(...args);
    }
    static now() {
      return now.getTime();
    }
  };

  try {
    // Fullday event for Jan 27 (stored as timestamps)
    const fulldayEvent = {
      title: 'Fullday Event',
      startDate: new Date('2026-01-27T00:00:00Z').getTime(), // Start of Jan 27 UTC
      endDate: new Date('2026-01-28T00:00:00Z').getTime(), // Start of Jan 28 UTC (24h later)
      fullDayEvent: true,
      calendarSeq: 1
    };

    const config = {
      calendarSet: [],
      maxItems: 100,
      maxDays: 90
    };

    const eventPool = new Map();
    eventPool.set('test-calendar', [fulldayEvent]);

    const regularized = regularizeEvents({ eventPool, config });
    const prepared = prepareEvents({
      targetEvents: regularized,
      config,
      range: { from: now.getTime(), to: now.getTime() + 7 * 24 * 60 * 60 * 1000 }
    });

    const processedEvent = prepared[0];

    // In UTC+1 timezone at 23:00 local (22:00 UTC):
    // - Current date: Jan 26 local
    // - Event date: Jan 27 UTC = Jan 27 local
    // => today should be FALSE

    // But if we were at 00:30 CET (23:30 UTC on Jan 26):
    // - Current date: Jan 27 local
    // - Event date: Jan 27
    // => today should be TRUE

    // This test checks the Jan 26 scenario
    assert.strictEqual(
      processedEvent.today,
      false,
      'Fullday event on Jan 27 should NOT be "today" when current time is Jan 26 23:00 local'
    );
  } finally {
    global.Date = originalDate;
  }
});

test('getWeekNo returns the previous year week number for early January spillover days', () => {
  const options = {
    firstDayOfWeek: 1,
    minimalDaysOfNewYear: 4,
  };

  assert.strictEqual(
    getWeekNo(new Date(2021, 0, 1), options),
    53,
    '2021-01-01 should still be in ISO week 53 of the previous year'
  );
});

test('timezone-aware comparison works regardless of system timezone', () => {
  // This test verifies the fix works by checking behavior in the current system timezone
  // It doesn't simulate a different timezone, but proves the logic is correct

  const now = new Date('2026-01-26T12:00:00Z'); // Noon UTC
  const originalDate = global.Date;

  global.Date = class extends originalDate {
    constructor(...args) {
      if (args.length === 0) {
        return now;
      }
      return new originalDate(...args);
    }
    static now() {
      return now.getTime();
    }
  };

  try {
    // Event clearly on a different day in local time
    // In UTC+1: Jan 26 noon → same day
    // Event at Jan 28 noon → different day
    const futureEvent = {
      title: 'Future Event',
      startDate: new Date('2026-01-28T12:00:00Z').getTime(), // 2 days later
      endDate: new Date('2026-01-28T13:00:00Z').getTime(),
      fullDayEvent: false,
      calendarSeq: 1
    };

    const sameDayEvent = {
      title: 'Same Day Event',
      startDate: new Date('2026-01-26T14:00:00Z').getTime(), // Same day
      endDate: new Date('2026-01-26T15:00:00Z').getTime(),
      fullDayEvent: false,
      calendarSeq: 2
    };

    const config = {
      calendarSet: [],
      maxItems: 100,
      maxDays: 90
    };

    const eventPool = new Map();
    eventPool.set('test-calendar', [futureEvent, sameDayEvent]);

    const regularized = regularizeEvents({ eventPool, config });
    const prepared = prepareEvents({
      targetEvents: regularized,
      config,
      range: { from: now.getTime(), to: now.getTime() + 7 * 24 * 60 * 60 * 1000 }
    });

    // Find events
    const future = prepared.find(e => e.title === 'Future Event');
    const sameDay = prepared.find(e => e.title === 'Same Day Event');

    // Verify: event 2 days in future should NOT be today
    assert.strictEqual(
      future.today,
      false,
      'Event 2 days in future should NOT be marked as today'
    );

    // Verify: event on same day should be today
    // Using local date comparison, both are Jan 26 in any normal timezone
    assert.strictEqual(
      sameDay.today,
      true,
      'Event on same day should be marked as today'
    );
  } finally {
    global.Date = originalDate;
  }
});

test('edge case - event at exactly midnight local time', () => {
  // Test the exact moment of day transition
  const now = new Date('2026-01-26T23:00:00Z'); // Exactly midnight CET (00:00 Jan 27 local)
  const originalDate = global.Date;

  global.Date = class extends originalDate {
    constructor(...args) {
      if (args.length === 0) {
        return now;
      }
      return new originalDate(...args);
    }
    static now() {
      return now.getTime();
    }
  };

  try {
    // Event at exactly midnight local time
    const midnightEvent = {
      title: 'Midnight Event',
      startDate: new Date('2026-01-26T23:00:00Z').getTime(), // Exactly 00:00 CET
      endDate: new Date('2026-01-27T00:00:00Z').getTime(),
      fullDayEvent: false,
      calendarSeq: 1
    };

    const config = {
      calendarSet: [],
      maxItems: 100,
      maxDays: 90
    };

    const eventPool = new Map();
    eventPool.set('test-calendar', [midnightEvent]);

    const regularized = regularizeEvents({ eventPool, config });
    const prepared = prepareEvents({
      targetEvents: regularized,
      config,
      range: { from: now.getTime(), to: now.getTime() + 7 * 24 * 60 * 60 * 1000 }
    });

    const processedEvent = prepared[0];

    // Both current time and event time are at the same moment (midnight local)
    // In local time: both are Jan 27 00:00 CET
    // => today should be TRUE
    assert.strictEqual(
      processedEvent.today,
      true,
      'Event starting at exactly midnight should be "today" when current time is also midnight'
    );
  } finally {
    global.Date = originalDate;
  }
});

test('multi-day fullday event spanning today', () => {
  // Test a fullday event that started yesterday and ends tomorrow
  const now = new Date('2026-01-27T12:00:00Z'); // Noon UTC on Jan 27
  const originalDate = global.Date;

  global.Date = class extends originalDate {
    constructor(...args) {
      if (args.length === 0) {
        return now;
      }
      return new originalDate(...args);
    }
    static now() {
      return now.getTime();
    }
  };

  try {
    // 3-day event: Jan 26-28
    const multiDayEvent = {
      title: 'Conference',
      startDate: new Date('2026-01-26T00:00:00Z').getTime(),
      endDate: new Date('2026-01-29T00:00:00Z').getTime(),
      fullDayEvent: true,
      calendarSeq: 1
    };

    const config = {
      calendarSet: [],
      maxItems: 100,
      maxDays: 90
    };

    const eventPool = new Map();
    eventPool.set('test-calendar', [multiDayEvent]);

    const regularized = regularizeEvents({ eventPool, config });
    const prepared = prepareEvents({
      targetEvents: regularized,
      config,
      range: { from: now.getTime() - 7 * 24 * 60 * 60 * 1000, to: now.getTime() + 7 * 24 * 60 * 60 * 1000 }
    });

    const processedEvent = prepared[0];

    // The event started on Jan 26 (in UTC), but "today" in UTC is Jan 27
    // The "today" flag checks startDate only, not whether event is currently running
    // So today should be FALSE (event started yesterday)
    assert.strictEqual(
      processedEvent.today,
      false,
      'Multi-day event that started yesterday should NOT have today=true'
    );

    // But it should be marked as current (running now)
    assert.strictEqual(
      processedEvent.isCurrent,
      true,
      'Multi-day event spanning today should be current'
    );
  } finally {
    global.Date = originalDate;
  }
});
