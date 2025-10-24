// Snapshot of components/sections/beta/BetaFinalCTA.tsx
import Link from 'next/link'
export default function BetaFinalCTA() {
  return (
    <section className="final-cta-section">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold mb-3">Ready to build faster and grow smarter?</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Join 50 creators already testing the future of creator management. Limited beta spots available.</p>
        <Link href="/join" className="final-cta-button">Join the Beta Now</Link>
        <div className="text-xs text-gray-500 mt-3">No credit card required • Beta access is free • Cancel anytime</div>
      </div>
    </section>
  )
}

