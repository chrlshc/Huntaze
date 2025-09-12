export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'America/New_York'
  } catch {
    return 'America/New_York'
  }
}

