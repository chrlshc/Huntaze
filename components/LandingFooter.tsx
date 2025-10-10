export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-6 text-xs text-gray-500 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} Huntaze. All rights reserved.</p>
        <div className="flex gap-4">
          <a
            href="/privacy"
            className="hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            Privacy
          </a>
          <a
            href="/terms"
            className="hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            Terms
          </a>
          <a
            href="/support"
            className="hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}
