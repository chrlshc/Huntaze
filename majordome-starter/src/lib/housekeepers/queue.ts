// Minimal housekeeper queue abstraction.
// Replace this with BullMQ / Azure Service Bus / Temporal / etc.
//
// The orchestrator (Majordome) never does the dirty work itself.
// It orders a Housekeeper job and waits for a report.

export type HousekeeperJobName =
  | "scrape_history"
  | "ingest_knowledge"
  | "clean_knowledge_base"
  | "analyze_profile"
  | "draft_broadcast"
  | "configure_settings"
  | "whale_watch";

export type EnqueueResult = { jobId: string };

export async function enqueueHousekeeperJob(
  name: HousekeeperJobName,
  payload: Record<string, unknown>,
): Promise<EnqueueResult> {
  const jobId = `job_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  // In prod: push to your real queue here.
  // eslint-disable-next-line no-console
  console.log(`🧹 Housekeeper queued: ${name}`, { jobId, payload });

  return { jobId };
}
