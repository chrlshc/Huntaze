export async function saveOnboarding(userId: string, step: string, data: Record<string, unknown>) {
  // Minimal no-op to unblock build. Replace with DB persistence.
  return { userId, step, ok: true }
}

