import { test } from 'node:test';
import assert from 'node:assert';
import { Window } from 'happy-dom';

/**
 * Tests for iconify pattern support
 * Related to Issue #15: https://github.com/MMRIZE/CX3_Shared/issues/15
 */

test('iconify alternative pattern: prefix--icon-name should work', async () => {
  // Mock DOM environment
  const window = new Window();
  global.document = window.document;
  global.window = window;
  global.customElements = window.customElements;

  // Import after DOM is set up
  const { renderSymbol } = await import('./CX3_shared.mjs');

  // Create event with alternative iconify pattern
  const event = {
    symbol: ['mdi--calendar']  // Alternative pattern with double dash
  };

  const eventDom = document.createElement('div');
  const options = {
    useSymbol: true,
    useIconify: true
  };

  renderSymbol(eventDom, event, options);

  // Find the iconify element
  const iconifyElement = eventDom.querySelector('iconify-icon');

  assert.ok(iconifyElement, 'iconify-icon element should be created');
  assert.strictEqual(
    iconifyElement.icon,
    'mdi:calendar',
    'Alternative pattern "mdi--calendar" should be converted to "mdi:calendar"'
  );
  assert.strictEqual(iconifyElement.inline, true, 'Icon should be inline');
});

test('iconify standard pattern: prefix:icon-name should still work', async () => {
  const window = new Window();
  global.document = window.document;
  global.window = window;
  global.customElements = window.customElements;

  const { renderSymbol } = await import('./CX3_shared.mjs');

  const event = {
    symbol: ['mdi:calendar']  // Standard pattern with colon
  };

  const eventDom = document.createElement('div');
  const options = {
    useSymbol: true,
    useIconify: true
  };

  renderSymbol(eventDom, event, options);

  const iconifyElement = eventDom.querySelector('iconify-icon');

  assert.ok(iconifyElement, 'iconify-icon element should be created');
  assert.strictEqual(
    iconifyElement.icon,
    'mdi:calendar',
    'Standard pattern "mdi:calendar" should work as before'
  );
});

test('iconify both patterns can be used together', async () => {
  const window = new Window();
  global.document = window.document;
  global.window = window;
  global.customElements = window.customElements;

  const { renderSymbol } = await import('./CX3_shared.mjs');

  const event = {
    symbol: ['mdi:calendar', 'fa--home', 'tabler:bell']  // Mixed patterns
  };

  const eventDom = document.createElement('div');
  const options = {
    useSymbol: true,
    useIconify: true
  };

  renderSymbol(eventDom, event, options);

  const iconifyElements = eventDom.querySelectorAll('iconify-icon');

  assert.strictEqual(iconifyElements.length, 3, 'Should create 3 iconify elements');
  assert.strictEqual(iconifyElements[0].icon, 'mdi:calendar', 'First icon correct');
  assert.strictEqual(iconifyElements[1].icon, 'fa:home', 'Second icon converted from "--" to ":"');
  assert.strictEqual(iconifyElements[2].icon, 'tabler:bell', 'Third icon correct');
});

test('non-iconify symbols should fallback to fontawesome', async () => {
  const window = new Window();
  global.document = window.document;
  global.window = window;
  global.customElements = window.customElements;

  const { renderSymbol } = await import('./CX3_shared.mjs');

  const event = {
    symbol: ['fa fa-calendar']  // FontAwesome class (no : or --)
  };

  const eventDom = document.createElement('div');
  const options = {
    useSymbol: true,
    useIconify: true
  };

  renderSymbol(eventDom, event, options);

  const iconifyElement = eventDom.querySelector('iconify-icon');
  const faElement = eventDom.querySelector('.fa.fa-calendar');

  assert.strictEqual(iconifyElement, null, 'Should NOT create iconify element for FA class');
  assert.ok(faElement, 'Should create FontAwesome span element');
  assert.strictEqual(faElement.className, 'fa fa-calendar', 'FA classes preserved');
});

test('events with the same color reuse the contrast calculation', async () => {
  const window = new Window();
  global.document = window.document;
  global.window = window;
  global.customElements = window.customElements;

  const { renderEvent } = await import('./CX3_shared.mjs');
  let computedStyleCalls = 0;
  window.getComputedStyle = () => {
    computedStyleCalls++;
    return { getPropertyValue: () => 'rgb(20, 30, 40)' };
  };

  const event = {
    title: 'Cached color',
    color: 'rgb(23, 47, 89)',
    symbol: [],
    fullDayEvent: false
  };

  renderEvent({ ...event }, { useSymbol: false, useIconify: false });
  renderEvent({ ...event }, { useSymbol: false, useIconify: false });

  assert.strictEqual(computedStyleCalls, 1);
});

test('agenda reuses one formatter for both event times', async () => {
  const window = new Window();
  global.document = window.document;
  global.window = window;
  global.customElements = window.customElements;

  const { renderEventAgenda } = await import('./CX3_shared.mjs');
  const originalDateTimeFormat = Intl.DateTimeFormat;
  let formatterConstructions = 0;
  Intl.DateTimeFormat = class extends originalDateTimeFormat {
    constructor(...args) {
      super(...args);
      formatterConstructions++;
    }
  };
  window.getComputedStyle = () => ({ getPropertyValue: () => 'rgb(20, 30, 40)' });

  const eventTimeOptions = { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' };
  const locale = 'es-ES-u-ca-gregory-nu-latn';
  const options = {
    useSymbol: false,
    useIconify: false,
    eventTimeOptions,
    locale,
    showMultidayEventsOnce: false
  };
  const event = {
    title: 'Formatter reuse',
    color: 'rgb(23, 47, 89)',
    symbol: [],
    fullDayEvent: false,
    isFullday: false,
    isMultiday: false,
    startDate: Date.parse('2026-10-17T10:00:00Z'),
    endDate: Date.parse('2026-10-17T11:00:00Z')
  };

  try {
    renderEventAgenda({ ...event }, options, new Date(event.startDate));
  } finally {
    Intl.DateTimeFormat = originalDateTimeFormat;
  }

  assert.strictEqual(formatterConstructions, 1);
});
