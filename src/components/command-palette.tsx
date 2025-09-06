'use client';

import { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Home, 
  DollarSign, 
  MessageSquare, 
  Settings, 
  LogOut,
  ChevronRight,
  FileText,
  HelpCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Toggle command palette with Cmd/Ctrl + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const commands = [
    {
      icon: Home,
      title: 'Dashboard',
      shortcut: '⌘D',
      action: () => router.push('/dashboard')
    },
    {
      icon: MessageSquare,
      title: 'Messages',
      shortcut: '⌘M',
      action: () => router.push('/messages')
    },
    {
      icon: DollarSign,
      title: 'Billing',
      shortcut: '⌘B',
      action: () => router.push('/billing')
    },
    {
      icon: Settings,
      title: 'Settings',
      shortcut: '⌘,',
      action: () => router.push('/settings')
    }
  ];

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="glass-button flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 ml-auto text-xs bg-gray-100 dark:bg-gray-800 rounded">
          ⌘K
        </kbd>
      </button>

      {/* Command Palette Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />

            {/* Command Palette */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl"
            >
              <Command className="glass rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xl">
                <div className="flex items-center gap-3 px-4 border-b border-gray-200 dark:border-gray-700">
                  <Search className="w-5 h-5 text-gray-400" />
                  <Command.Input 
                    placeholder="Type a command or search..."
                    className="w-full py-4 bg-transparent outline-none placeholder:text-gray-400"
                  />
                  <kbd className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    ESC
                  </kbd>
                </div>
                
                <Command.List className="max-h-96 overflow-y-auto p-2">
                  <Command.Empty className="py-8 text-center text-sm text-gray-500">
                    No results found.
                  </Command.Empty>

                  <Command.Group heading="Quick Actions">
                    {commands.map((command) => (
                      <Command.Item
                        key={command.title}
                        value={command.title}
                        onSelect={() => runCommand(command.action)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                          <command.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <span className="flex-1 font-medium">{command.title}</span>
                        <span className="text-xs text-gray-400">{command.shortcut}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>

                  <Command.Separator className="my-2 h-px bg-gray-200 dark:bg-gray-700" />

                  <Command.Group heading="Help">
                    <Command.Item
                      value="Documentation"
                      onSelect={() => runCommand(() => window.open('/docs', '_blank'))}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="flex-1">Documentation</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Command.Item>
                    <Command.Item
                      value="Support"
                      onSelect={() => runCommand(() => router.push('/support'))}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <HelpCircle className="w-5 h-5 text-gray-400" />
                      <span className="flex-1">Support</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Command.Item>
                  </Command.Group>

                  <Command.Separator className="my-2 h-px bg-gray-200 dark:bg-gray-700" />

                  <Command.Group heading="Account">
                    <Command.Item
                      value="Sign Out"
                      onSelect={() => runCommand(() => {
                        // Handle sign out
                        router.push('/auth/signin');
                      })}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="flex-1">Sign Out</span>
                    </Command.Item>
                  </Command.Group>
                </Command.List>
              </Command>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}