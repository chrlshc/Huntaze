'use client';

import { useState } from 'react';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { TouchTarget } from '@/components/ui/TouchTarget';

export default function ModalsDemo() {
  const [isSmallOpen, setIsSmallOpen] = useState(false);
  const [isMediumOpen, setIsMediumOpen] = useState(false);
  const [isLargeOpen, setIsLargeOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1A1A1A] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Responsive Modals Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Modals that are full-screen on mobile (&lt;768px) and centered on desktop
          </p>
        </div>

        {/* Modal Triggers */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Small Modal
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Compact modal for simple confirmations
            </p>
            <TouchTarget
              variant="primary"
              fullWidth
              onClick={() => setIsSmallOpen(true)}
            >
              Open Small Modal
            </TouchTarget>
          </div>

          <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Medium Modal
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Standard modal for most use cases
            </p>
            <TouchTarget
              variant="primary"
              fullWidth
              onClick={() => setIsMediumOpen(true)}
            >
              Open Medium Modal
            </TouchTarget>
          </div>

          <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Large Modal
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Spacious modal for complex content
            </p>
            <TouchTarget
              variant="primary"
              fullWidth
              onClick={() => setIsLargeOpen(true)}
            >
              Open Large Modal
            </TouchTarget>
          </div>
        </div>

        {/* Form Modal Example */}
        <div className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-sm border border-gray-200 dark:border-[#2A2A2A] p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Form Modal Example
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Full-featured modal with form elements
          </p>
          <TouchTarget
            variant="primary"
            onClick={() => setIsFormOpen(true)}
          >
            Open Form Modal
          </TouchTarget>
        </div>

        {/* Guidelines */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">
            Responsive Modal Behavior
          </h3>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p>
              <strong>Desktop (≥768px):</strong> Centered modal with rounded corners and max-height of 90vh
            </p>
            <p>
              <strong>Mobile (&lt;768px):</strong> Full-screen modal with no border-radius, taking up entire viewport
            </p>
            <p>
              <strong>Accessibility:</strong> Keyboard navigation (ESC to close), focus trap, and ARIA attributes
            </p>
            <p>
              <strong>Backdrop:</strong> Semi-transparent overlay with blur effect
            </p>
            <p>
              <strong>Scrolling:</strong> Body scroll locked when modal is open, content scrolls within modal
            </p>
          </div>
        </div>
      </div>

      {/* Small Modal */}
      <Modal
        isOpen={isSmallOpen}
        onClose={() => setIsSmallOpen(false)}
        title="Confirm Action"
        size="sm"
      >
        <ModalBody>
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to proceed with this action? This cannot be undone.
          </p>
        </ModalBody>
        <ModalFooter>
          <TouchTarget
            variant="ghost"
            onClick={() => setIsSmallOpen(false)}
          >
            Cancel
          </TouchTarget>
          <TouchTarget
            variant="danger"
            onClick={() => setIsSmallOpen(false)}
          >
            Confirm
          </TouchTarget>
        </ModalFooter>
      </Modal>

      {/* Medium Modal */}
      <Modal
        isOpen={isMediumOpen}
        onClose={() => setIsMediumOpen(false)}
        title="Medium Modal"
        size="md"
      >
        <ModalBody>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              This is a medium-sized modal that works great for most use cases.
            </p>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Key Features
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                <li>Full-screen on mobile devices</li>
                <li>Centered with rounded corners on desktop</li>
                <li>Smooth transitions and animations</li>
                <li>Keyboard accessible (ESC to close)</li>
              </ul>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <TouchTarget
            variant="secondary"
            onClick={() => setIsMediumOpen(false)}
          >
            Close
          </TouchTarget>
        </ModalFooter>
      </Modal>

      {/* Large Modal */}
      <Modal
        isOpen={isLargeOpen}
        onClose={() => setIsLargeOpen(false)}
        title="Large Modal with Scrollable Content"
        size="lg"
      >
        <ModalBody>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              This large modal demonstrates scrollable content. Try scrolling within the modal.
            </p>
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4"
              >
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Content Block {i + 1}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  This is some sample content to demonstrate scrolling behavior within the modal.
                </p>
              </div>
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <TouchTarget
            variant="primary"
            onClick={() => setIsLargeOpen(false)}
          >
            Got it
          </TouchTarget>
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
              <label
                htmlFor="item-name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Item Name
              </label>
              <input
                type="text"
                id="item-name"
                className="w-full px-4 py-2.5 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter item name"
              />
            </div>
            <div>
              <label
                htmlFor="item-description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Description
              </label>
              <textarea
                id="item-description"
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Enter description"
              />
            </div>
            <div>
              <label
                htmlFor="item-category"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Category
              </label>
              <select
                id="item-category"
                className="w-full px-4 py-2.5 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option>Select a category</option>
                <option>Category 1</option>
                <option>Category 2</option>
                <option>Category 3</option>
              </select>
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <TouchTarget
            variant="ghost"
            onClick={() => setIsFormOpen(false)}
          >
            Cancel
          </TouchTarget>
          <TouchTarget
            variant="primary"
            onClick={() => setIsFormOpen(false)}
          >
            Create Item
          </TouchTarget>
        </ModalFooter>
      </Modal>
    </div>
  );
}
