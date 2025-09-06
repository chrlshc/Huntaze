'use client';

import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { SimpleAccount } from '@/lib/of/simple-multi-account';

interface AccountSwitcherProps {
  accounts: SimpleAccount[];
  currentAccountId: string;
  onSwitch: (accountId: string) => void;
  maxAccounts: number;
}

export default function AccountSwitcher({ 
  accounts, 
  currentAccountId, 
  onSwitch,
  maxAccounts 
}: AccountSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentAccount = accounts.find(a => a.id === currentAccountId);
  
  if (accounts.length <= 1) return null; // No need to switch
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-400"
      >
        <div className="text-left">
          <p className="font-medium">{currentAccount?.displayName}</p>
          <p className="text-xs text-gray-500">
            ${currentAccount?.revenue30d || 0} • {currentAccount?.pendingMessages || 0} pending
          </p>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-2">
              <p className="text-xs text-gray-500 px-3 py-1">
                {accounts.length} of {maxAccounts} accounts
              </p>
              
              {accounts.map(account => (
                <button
                  key={account.id}
                  onClick={() => {
                    onSwitch(account.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    account.id === currentAccountId ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                  }`}
                >
                  <div className="text-left">
                    <p className="font-medium">{account.displayName}</p>
                    <p className="text-xs text-gray-500">
                      ${account.revenue30d} revenue
                    </p>
                  </div>
                  {account.id === currentAccountId && (
                    <Check className="w-4 h-4 text-purple-600" />
                  )}
                </button>
              ))}
              
              {accounts.length < maxAccounts && (
                <button className="w-full px-3 py-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded text-sm font-medium">
                  + Add Account
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}