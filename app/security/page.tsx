export const dynamic = 'force-static'

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
        <h1 className="text-3xl font-semibold mb-3">Security Overview</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-8">
          Huntaze is built with a privacy‑first mindset on top of AWS. This page summarizes our current safeguards.
        </p>

        <div className="space-y-6">
          <section className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Data protection</h2>
            <ul className="list-disc pl-5 text-sm text-slate-700 dark:text-slate-300 space-y-1">
              <li>Encryption in transit (HTTPS/TLS) and at rest (managed by AWS for storage services).</li>
              <li>Access control via least‑privilege IAM roles and environment isolation.</li>
              <li>Regular backups and ability to restore critical metadata.</li>
            </ul>
          </section>

          <section className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Monitoring & logging</h2>
            <ul className="list-disc pl-5 text-sm text-slate-700 dark:text-slate-300 space-y-1">
              <li>Application logs for troubleshooting and anomaly detection.</li>
              <li>Basic rate‑limits and abuse prevention on public endpoints.</li>
              <li>Incident response process for investigating and mitigating issues.</li>
            </ul>
          </section>

          <section className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Privacy & compliance</h2>
            <ul className="list-disc pl-5 text-sm text-slate-700 dark:text-slate-300 space-y-1">
              <li>Privacy Policy and cookie controls available from the site footer.</li>
              <li>Data ownership: your data remains yours; we use it only to provide the service.</li>
              <li>Shared responsibility model with AWS: AWS secures the cloud; we secure our workloads in the cloud.</li>
            </ul>
          </section>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Note: This is an overview. For questions or disclosures, contact support.
          </p>
        </div>
      </div>
    </div>
  )
}

