import Link from 'next/link'
import { Button } from './ui/button'
import { 
  Twitter, Instagram, Youtube, Linkedin, Github,
  CheckCircle, ArrowRight, Globe
} from 'lucide-react'

type FooterLink = {
  name: string;
  href: string;
  badge?: string;
}

type FooterSection = {
  title: string;
  links: FooterLink[];
}

const footerLinks: Record<string, FooterSection> = {
  product: {
    title: 'Product',
    links: [
      { name: 'Features', href: '/features/ai-chat' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'Security', href: '/about' },
      { name: 'Roadmap', href: '/about' },
      { name: 'Changelog', href: '/about' }
    ]
  },
  solutions: {
    title: 'Solutions',
    links: [
      { name: 'OnlyFans Creators', href: '/features/ai-chat' },
      { name: 'Fansly Creators', href: '/features/ai-chat' },
      { name: 'Instagram Creators', href: '/features/automation' },
      { name: 'Multi-Platform', href: '/features/automation' },
      { name: 'Agencies', href: '/agency-comparison' }
    ]
  },
  resources: {
    title: 'Resources',
    links: [
      { name: 'Agency Comparison', href: '/agency-comparison' },
      { name: 'Blog', href: '/about' },
      { name: 'Learn', href: '/#learn' },
      { name: 'Help Center', href: '/about' },
      { name: 'API Documentation', href: '/about' },
      { name: 'System Status', href: '/about' }
    ]
  },
  company: {
    title: 'Company',
    links: [
      { name: 'About', href: '/about' },
      { name: 'Careers', href: '/about', badge: 'Hiring' },
      { name: 'Press', href: '/about' },
      { name: 'Contact', href: '/about' },
      { name: 'Partners', href: '/about' }
    ]
  },
  legal: {
    title: 'Legal',
    links: [
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Cookie Policy', href: '/privacy' },
      { name: 'GDPR', href: '/privacy' },
      { name: 'DMCA', href: '/terms' }
    ]
  }
}

const socialLinks = [
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/huntaze' },
  { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/huntaze' },
  { name: 'YouTube', icon: Youtube, href: 'https://youtube.com/huntaze' },
  { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/huntaze' },
  { name: 'GitHub', icon: Github, href: 'https://github.com/huntaze' }
]

export default function FooterImproved() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <h3 className="text-2xl font-bold text-white mb-2">
                Get creator tips & platform updates
              </h3>
              <p className="text-gray-400">
                Join 10,000+ creators getting weekly insights to grow their business.
              </p>
            </div>
            <div className="mt-6 lg:mt-0">
              <form className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 flex-1"
                />
                <Button 
                  type="submit"
                  variant="gradient"
                  className="px-6 py-3"
                >
                  Subscribe
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
              <p className="text-xs text-gray-500 mt-2">
                Unsubscribe anytime. No spam, ever.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center mb-4">
              <img 
                src="/huntaze-logo.png" 
                alt="Huntaze" 
                className="h-10 w-auto brightness-0 invert"
              />
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              The AI platform that helps creators keep 98% of their revenue.
            </p>
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors inline-flex items-center"
                    >
                      {link.name}
                      {link.badge && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-purple-600 text-white rounded-full">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-400">GDPR‑Aligned</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-400">Security Best Practices</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-400">AES‑256‑GCM Encryption</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-400">High Availability</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>© 2024 Huntaze. All rights reserved.</span>
              <span className="hidden md:inline">•</span>
              <Link href="/about" className="hover:text-white transition-colors hidden md:inline">
                Sitemap
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors">
                <Globe className="w-4 h-4" />
                <span>English (US)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
