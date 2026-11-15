# EPH 442B Room Booking API

The `/room-b` page uses TanStack Start [server functions](../../apps/portal/src/features/room-b/actions.ts). All actions require an active portal session. Call them with `{ data: input }`.

| Action                         | Method | Input                                   |
| ------------------------------ | ------ | --------------------------------------- |
| `getRoomBCalendarAction`       | GET    | `{ week?: "YYYY-MM-DD" }`               |
| `getRoomBBookingContextAction` | GET    | `{ week?: "YYYY-MM-DD" }`               |
| `createRoomBBookingAction`     | POST   | `{ date, startHour, endHour, owner }`   |
| `cancelRoomBBookingAction`     | POST   | `{ bookingId }`                         |
| `overwriteRoomBBookingAction`  | POST   | `{ bookingId, owner, confirmed: true }` |

An `owner` is either:

```ts
{ kind: 'club', clubId: '<uuid>' }
{ kind: 'boardMember', memberId: '<uuid>' }
```

The calendar returns weekday hourly slots and booking labels. Booking context returns eligible owners, daily/weekly balances, and IDs of bookings the caller can cancel. Creating a booking returns `{ id, date, startHour, endHour }[]`, one entry per hour.

- Bookings are Monday–Friday, 8 AM–10 PM Toronto time, in the current or next week. Hours are integers; `endHour` is exclusive.
- Each Club shares two hours/day and six hours/week. Board Members have the same personal limits. Usage follows Monday–Sunday Toronto weeks without a reset job.
- Members can book and cancel for their Clubs or themselves as Board Members. Administrators and the Superuser can act for any eligible owner, cancel any future booking, and overwrite it with confirmation.
- Administrator and Superuser personal bookings are unlimited but still require Board Member access. Bookings for other owners use that owner's limits.
- Cancellation preserves history and releases the hour. Multi-hour bookings and overwrites succeed together or roll back. Started hours cannot be booked, cancelled, or overwritten.

Without `week`, reads show this week on weekdays and the upcoming week on weekends. Explicit dates are normalized to Monday; past weeks can be viewed.

Apply migrations `0015` and `0016` with `pnpm db:migrate` before using the feature. See [ADR 0018](../adr/0018-add-room-b-bookings-with-owner-quotas.md) for the design decisions.
