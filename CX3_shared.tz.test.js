process.env.TZ = 'America/New_York'

import { test } from 'node:test'
import assert from 'node:assert'
import { prepareEvents, regularizeEvents } from './CX3_shared.js'

const prepare = (startDate, endDate) => {
  const eventPool = new Map([['c', [{ title: 'All day', startDate, endDate, fullDayEvent: true }]]])
  const targetEvents = regularizeEvents({ eventPool, config: {} })
  return prepareEvents({ targetEvents, config: {}, range: [0, Date.parse('2100-01-01')] })[0]
}

test('fullday event sent as UTC midnight stays on its date west of UTC', () => {
  const ev = prepare(Date.parse('2026-10-20T00:00:00Z'), Date.parse('2026-10-21T00:00:00Z'))
  assert.strictEqual(ev.startDate, new Date(2026, 9, 20).getTime())
  assert.strictEqual(ev.isMultiday, false)
})

test('fullday event sent as local midnight is unchanged', () => {
  const ev = prepare(new Date(2026, 9, 20).getTime(), new Date(2026, 9, 21).getTime())
  assert.strictEqual(ev.startDate, new Date(2026, 9, 20).getTime())
  assert.strictEqual(ev.isMultiday, false)
})
