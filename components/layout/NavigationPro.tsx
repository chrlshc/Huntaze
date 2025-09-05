"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, X, Sun, Moon, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSafeTheme } from "@/src/hooks/useSafeTheme";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Accueil" },
  { href: "/features", label: "Fonctionnalités" },
  { href: "/pricing", label: "Tarifs" },
  { href: "/about", label: "À propos" },
  { href: "/blog", label: "Blog" },
];

export function NavigationPro() {
  const { theme, toggleTheme } = useSafeTheme();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="container-width">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <span className="font-bold text-2xl text-gradient">Huntaze</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative font-medium transition-colors ${
                    pathname === item.href
                      ? "text-purple-600 dark:text-purple-400"
                      : "text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                  }`}
                >
                  {item.label}
                  {pathname === item.href && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-2 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400"
                      transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
              >
                <AnimatePresence mode="wait">
                  {theme === "light" ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              {/* CTA Buttons */}
              <div className="hidden md:flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="ghost" className="font-medium">
                    Se connecter
                  </Button>
                </Link>
                <Link href="/onboarding">
                  <Button className="btn-primary">
                    Démarrer gratuitement
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 lg:hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <span className="font-bold text-xl text-gradient">Menu</span>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-4">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`block py-3 px-4 rounded-lg font-medium transition-colors ${
                          pathname === item.href
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Se connecter
                    </Button>
                  </Link>
                  <Link href="/onboarding" onClick={() => setIsMenuOpen(false)}>
                    <Button className="btn-primary w-full">
                      Démarrer gratuitement
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}