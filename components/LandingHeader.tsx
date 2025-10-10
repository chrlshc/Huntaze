import Link from "next/link";

const navLinks = [
  { href: "/product", label: "Product" },
  { href: "/pricing", label: "Pricing" },
  { href: "/customers", label: "Customers" },
  { href: "/support", label: "Support" },
];

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-gray-900/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-lg font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        >
          Huntaze
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-300 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm font-semibold text-gray-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            Sign in
          </Link>
          <Link
            href="/auth/login"
            className="hidden rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 sm:inline-flex"
          >
            Open App
          </Link>
        </div>
      </div>
    </header>
  );
}
