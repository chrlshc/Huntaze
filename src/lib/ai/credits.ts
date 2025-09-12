// Message credits consumption (stubbed without DB). Replace with DB-backed implementation.

export async function consumeMessageCredits(_accountId: string, count = 1) {
  // No persistence by default; return uncovered count to indicate not covered by packs
  return count
}

