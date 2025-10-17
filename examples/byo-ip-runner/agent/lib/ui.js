import { DateTime } from 'luxon'

export async function pickDateTime(page, isoUtc, tz) {
  const dt = DateTime.fromISO(isoUtc, { zone: 'utc' }).setZone(tz || 'UTC')
  // Try inputs first
  const dateInput = page.getByRole('textbox', { name: /date/i })
  const timeInput = page.getByRole('textbox', { name: /time/i })

  if (await dateInput.isVisible().catch(() => false)) {
    await dateInput.fill(dt.toFormat('yyyy-LL-dd'))
  }
  if (await timeInput.isVisible().catch(() => false)) {
    await timeInput.fill(dt.toFormat('HH:mm'))
  }
}

