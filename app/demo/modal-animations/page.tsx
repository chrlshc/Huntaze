'use client';

import { useState } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle, Info, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';

/**
 * Modal Animations Demo Page
 * 
 * Demonstrates modal animations with scale and fade effects using spring transitions.
 * Requirements: 4.5
 */

export default function ModalAnimationsDemo() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLargeOpen, setIsLargeOpen] = useState(false);

  const handleDelete = () => {
    setIsConfirmOpen(false);
    setIsSuccessOpen(true);
  };

  return (
    <div className="min-h-screen bg-theme-bg p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/demo/list-stagger"
            className="p-2 rounded-lg hover:bg-theme-border/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-theme-text" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-theme-text">Modal Animations</h1>
            <p className="text-theme-muted mt-1">
              Scale and fade effects with spring transitions
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-theme-surface rounded-xl p-6 border border-theme-border">
          <h2 className="text-lg font-semibold text-theme-text mb-2">
            Animation Details
          </h2>
          <ul className="space-y-2 text-sm text-theme-muted">
            <li>• Initial: opacity 0, scale 0.9, y 20px</li>
            <li>• Animate: opacity 1, scale 1, y 0</li>
            <li>• Exit: opacity 0, scale 0.9, y 20px</li>
            <li>• Transition: Spring (damping: 25, stiffness: 300)</li>
            <li>• Overlay: Fade in/out over 200ms</li>
          </ul>
        </div>

        {/* Modal Triggers */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Info Modal */}
          <button
            onClick={() => setIsInfoOpen(true)}
            className="p-6 bg-theme-surface rounded-xl border border-theme-border hover:border-blue-500/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Info className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-theme-text">Info Modal</h3>
            </div>
            <p className="text-sm text-theme-muted">
              Simple information modal with spring animation
            </p>
          </button>

          {/* Confirm Modal */}
          <button
            onClick={() => setIsConfirmOpen(true)}
            className="p-6 bg-theme-surface rounded-xl border border-theme-border hover:border-red-500/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-theme-text">Confirm Modal</h3>
            </div>
            <p className="text-sm text-theme-muted">
              Confirmation dialog with destructive action
            </p>
          </button>

          {/* Success Modal */}
          <button
            onClick={() => setIsSuccessOpen(true)}
            className="p-6 bg-theme-surface rounded-xl border border-theme-border hover:border-green-500/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-theme-text">Success Modal</h3>
            </div>
            <p className="text-sm text-theme-muted">
              Success feedback with animated icon
            </p>
          </button>

          {/* Form Modal */}
          <button
            onClick={() => setIsFormOpen(true)}
            className="p-6 bg-theme-surface rounded-xl border border-theme-border hover:border-purple-500/50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="font-semibold text-theme-text">Form Modal</h3>
            </div>
            <p className="text-sm text-theme-muted">
              Modal with form inputs and validation
            </p>
          </button>
        </div>

        {/* Large Content Modal */}
        <button
          onClick={() => setIsLargeOpen(true)}
          className="w-full p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20 hover:border-blue-500/50 transition-colors text-left"
        >
          <h3 className="font-semibold text-theme-text mb-2">Large Content Modal</h3>
          <p className="text-sm text-theme-muted">
            Modal with scrollable content and spring animation
          </p>
        </button>

        {/* Modals */}
        
        {/* Info Modal */}
        <Modal
          isOpen={isInfoOpen}
          onClose={() => setIsInfoOpen(false)}
          title="Information"
          size="sm"
        >
          <ModalBody>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex-shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <p className="text-theme-text mb-2">
                  This modal uses Framer Motion for smooth animations.
                </p>
                <p className="text-sm text-theme-muted">
                  The spring transition creates a natural, bouncy effect that feels responsive and polished.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <button
              onClick={() => setIsInfoOpen(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Got it
            </button>
          </ModalFooter>
        </Modal>

        {/* Confirm Modal */}
        <Modal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          title="Confirm Deletion"
          size="sm"
        >
          <ModalBody>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-theme-text mb-2">
                  Are you sure you want to delete this item?
                </p>
                <p className="text-sm text-theme-muted">
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <button
              onClick={() => setIsConfirmOpen(false)}
              className="px-4 py-2 bg-theme-surface text-theme-text rounded-lg hover:bg-theme-border transition-colors border border-theme-border"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </ModalFooter>
        </Modal>

        {/* Success Modal */}
        <Modal
          isOpen={isSuccessOpen}
          onClose={() => setIsSuccessOpen(false)}
          title="Success!"
          size="sm"
        >
          <ModalBody>
            <div className="text-center py-4">
              <div className="inline-flex p-3 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <p className="text-theme-text mb-2 font-medium">
                Item deleted successfully
              </p>
              <p className="text-sm text-theme-muted">
                The item has been permanently removed.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <button
              onClick={() => setIsSuccessOpen(false)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full"
            >
              Close
            </button>
          </ModalFooter>
        </Modal>

        {/* Form Modal */}
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title="Create New Item"
          size="md"
        >
          <ModalBody>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme-text mb-1">
                  Title
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-theme-bg border border-theme-border rounded-lg text-theme-text focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-text mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 bg-theme-bg border border-theme-border rounded-lg text-theme-text focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme-text mb-1">
                  Category
                </label>
                <select className="w-full px-3 py-2 bg-theme-bg border border-theme-border rounded-lg text-theme-text focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Select category</option>
                  <option>Work</option>
                  <option>Personal</option>
                  <option>Other</option>
                </select>
              </div>
            </form>
          </ModalBody>
          <ModalFooter>
            <button
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 bg-theme-surface text-theme-text rounded-lg hover:bg-theme-border transition-colors border border-theme-border"
            >
              Cancel
            </button>
            <button
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create
            </button>
          </ModalFooter>
        </Modal>

        {/* Large Content Modal */}
        <Modal
          isOpen={isLargeOpen}
          onClose={() => setIsLargeOpen(false)}
          title="Terms and Conditions"
          size="lg"
        >
          <ModalBody>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h3>1. Introduction</h3>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
              <h3>2. User Agreement</h3>
              <p>
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <h3>3. Privacy Policy</h3>
              <p>
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
              </p>
              <h3>4. Data Collection</h3>
              <p>
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
              <h3>5. Cookies</h3>
              <p>
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.
              </p>
              <h3>6. Third-Party Services</h3>
              <p>
                Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
              </p>
              <h3>7. Termination</h3>
              <p>
                Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <button
              onClick={() => setIsLargeOpen(false)}
              className="px-4 py-2 bg-theme-surface text-theme-text rounded-lg hover:bg-theme-border transition-colors border border-theme-border"
            >
              Decline
            </button>
            <button
              onClick={() => setIsLargeOpen(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Accept
            </button>
          </ModalFooter>
        </Modal>
      </div>
    </div>
  );
}
