import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resolvePortalIdentity } from '../../auth/identity'
import { getRoomBCalendarAction } from './actions'
import { getRoomBCalendar } from './calendar'
import type { PortalIdentity } from '../../auth/access'

vi.mock('@tanstack/react-start', () => ({
  createServerOnlyFn: (fn: unknown) => fn,
  createServerFn: () => ({
    validator: () => ({
      handler: (handler: (input: { data: unknown }) => unknown) => handler,
    }),
  }),
}))
vi.mock('../../auth/identity', () => ({ resolvePortalIdentity: vi.fn() }))
vi.mock('./calendar', () => ({ getRoomBCalendar: vi.fn() }))
vi.mock('./bookings', () => ({
  getRoomBBookingContext: vi.fn(),
  createRoomBBooking: vi.fn(),
  cancelRoomBBooking: vi.fn(),
  overwriteRoomBBooking: vi.fn(),
}))

beforeEach(() => vi.resetAllMocks())

describe('Room B calendar access', () => {
  it.each(['anonymous', 'denied'] as const)(
    'rejects %s requests before reading reservations',
    async (kind) => {
      vi.mocked(resolvePortalIdentity).mockResolvedValue({ kind })

      await expect(getRoomBCalendarAction({ data: {} })).rejects.toThrow(
        'Sign in',
      )
      expect(getRoomBCalendar).not.toHaveBeenCalled()
    },
  )

  it.each(['member', 'administrator', 'superuser'] as const)(
    'allows an authenticated %s to view the calendar',
    async (kind) => {
      const identity: PortalIdentity = { kind, email: 'viewer@example.com' }
      vi.mocked(resolvePortalIdentity).mockResolvedValue(identity)
      const calendar = {
        week: '2030-01-07',
        currentWeek: '2030-01-07',
        nextBookableWeek: '2030-01-14',
        days: [],
      }
      vi.mocked(getRoomBCalendar).mockResolvedValue(calendar)

      await expect(
        getRoomBCalendarAction({ data: { week: calendar.week } }),
      ).resolves.toEqual(calendar)
      expect(getRoomBCalendar).toHaveBeenCalledWith({ week: calendar.week })
    },
  )

  it('does not read reservations if session verification fails', async () => {
    vi.mocked(resolvePortalIdentity).mockRejectedValue(new Error('Unavailable'))

    await expect(getRoomBCalendarAction({ data: {} })).rejects.toThrow(
      'Unavailable',
    )
    expect(getRoomBCalendar).not.toHaveBeenCalled()
  })
})
