import test from 'node:test'
import assert from 'node:assert/strict'
import { generateSlotsForDate, getAvailableDates } from '../services/bookingAvailability.service.js'

test('generateSlotsForDate respects interval and buffer', () => {
  const slots = generateSlotsForDate({
    date: '2026-08-18',
    serviceDuration: 30,
    bufferMinutes: 30,
    periods: [{ start: '09:00', end: '11:00' }],
    now: new Date('2026-08-18T08:00:00'),
    minimumNoticeHours: 0,
  })

  assert.deepEqual(slots, ['09:00', '10:00'])
})

test('getAvailableDates returns only dates with at least one slot', async () => {
  const dates = await getAvailableDates({
    serviceId: '507f1f77bcf86cd799439011',
    counsellorId: '507f1f77bcf86cd799439012',
    availability: {
      weeklySchedule: {
        tuesday: { enabled: true, periods: [{ start: '09:00', end: '10:00' }] },
        wednesday: { enabled: false, periods: [] },
      },
      dateOverrides: [],
      bookingRules: { bufferMinutes: 0, minimumNoticeHours: 0, bookingWindowDays: 3 },
    },
    serviceDuration: 30,
    now: new Date('2026-08-18T08:00:00'),
    timezone: 'Asia/Kolkata',
  })

  assert.deepEqual(dates, ['2026-08-18'])
})
