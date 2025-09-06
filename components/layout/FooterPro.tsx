"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Instagram, Twitter, Linkedin, Youtube, Mail, MapPin, Shield, Heart } from "lucide-react";

const footerLinks = {
  product: {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "/features" },
      { label: "Tarifs", href: "/pricing" },
      { label: "API", href: "/api" },
      { label: "Intégrations", href: "/integrations" },
    ],
  },
  company: {
    title: "Entreprise",
    links: [
      { label: "À propos", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Carrières", href: "/careers" },
      { label: "Presse", href: "/press" },
    ],
  },
  support: {
    title: "Support",
    links: [
      { label: "Centre d'aide", href: "/help" },
      { label: "Contact", href: "/contact" },
      { label: "Status", href: "/status" },
      { label: "Communauté", href: "/community" },
    ],
  },
  legal: {
    title: "Légal",
    links: [
      { label: "Confidentialité", href: "/privacy" },
      { label: "CGU", href: "/terms" },
      { label: "RGPD", href: "/gdpr" },
      { label: "Cookies", href: "/cookies" },
    ],
  },
};

const socialLinks = [
  { icon: Instagram, href: "https://instagram.com/huntaze", label: "Instagram" },
  { icon: Twitter, href: "https://twitter.com/huntaze", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com/company/huntaze", label: "LinkedIn" },
  { icon: Youtube, href: "https://youtube.com/@huntaze", label: "YouTube" },
];

export function FooterPro() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container-width py-12 lg:py-16">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">H</span>
                </div>
                <span className="font-bold text-2xl text-gradient">Huntaze</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 max-w-sm">
                L'IA conversationnelle qui transforme vos interactions sociales en opportunités de revenus, 
                tout en respectant votre authenticité.
              </p>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-semibold mb-3">Restez informé</h4>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="votre@email.com"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h4 className="font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="py-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Shield className="w-5 h-5 text-green-600" />
              <span>RGPD Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">ISO</span>
              </div>
              <span>ISO 27001 Certified</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="w-5 h-5 text-purple-600" />
              <span>Hébergé en France</span>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} Huntaze. Tous droits réservés.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              Fait avec <Heart className="w-4 h-4 text-red-500 fill-current" /> à Paris
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}