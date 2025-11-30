'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from "@/components/ui/button";

/**
 * Modal Component Examples
 * 
 * Demonstrates various use cases and configurations of the Modal component.
 */

export function ModalExamples() {
  const [basicOpen, setBasicOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [largeOpen, setLargeOpen] = useState(false);
  const [scrollOpen, setScrollOpen] = useState(false);
  const [noBackdropClose, setNoBackdropClose] = useState(false);

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>
        Modal Component Examples
      </h1>

      {/* Example 1: Basic Modal */}
      <section>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
          1. Basic Modal
        </h2>
        <Button 
          variant="primary" 
          onClick={() => setBasicOpen(true)}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
          }}
        >
          Open Basic Modal
</Button>
        <Modal
          isOpen={basicOpen}
          onClose={() => setBasicOpen(false)}
          title="Welcome"
        >
          <p>This is a basic modal with a title and content.</p>
        </Modal>
      </section>

      {/* Example 2: Confirmation Modal */}
      <section>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
          2. Confirmation Modal with Footer
        </h2>
        <Button 
          variant="primary" 
          onClick={() => setConfirmOpen(true)}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--accent-error)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
          }}
        >
          Delete Item
        </Button>
        <Modal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Confirm Deletion"
          footer={
            <>
              <Button 
                variant="primary" 
                onClick={() => setConfirmOpen(false)}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  alert('Item deleted!');
                  setConfirmOpen(false);
                }}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'var(--accent-error)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                Delete
</Button>
            </>
          }
        >
          <p>Are you sure you want to delete this item? This action cannot be undone.</p>
        </Modal>
      </section>

      {/* Example 3: Form Modal */}
      <section>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
          3. Form Modal
        </h2>
        <Button 
          variant="primary" 
          onClick={() => setFormOpen(true)}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
          }}
        >
          Add New Item
        </Button>
        <Modal
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          title="Add New Item"
          footer={
            <>
              <Button 
                variant="primary" 
                onClick={() => setFormOpen(false)}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  alert('Item added!');
                  setFormOpen(false);
                }}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'var(--accent-success)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                Save
              </Button>
            </>
          }
        >
          <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                Name
              </label>
              <input
                type="text"
                placeholder="Enter name"
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                Description
              </label>
              <textarea
                placeholder="Enter description"
                rows={4}
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                }}
              />
            </div>
          </form>
        </Modal>
      </section>

      {/* Example 4: Large Modal */}
      <section>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
          4. Large Modal
        </h2>
        <Button 
          variant="primary" 
          onClick={() => setLargeOpen(true)}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
          }}
        >
          Open Large Modal
        </Button>
        <Modal
          isOpen={largeOpen}
          onClose={() => setLargeOpen(false)}
          title="Large Content Modal"
          size="lg"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
            <div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Column 1</h3>
              <p>Content for the first column with more space.</p>
            </div>
            <div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Column 2</h3>
              <p>Content for the second column with more space.</p>
            </div>
          </div>
        </Modal>
      </section>

      {/* Example 5: Scrollable Content */}
      <section>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
          5. Scrollable Content Modal
        </h2>
        <Button 
          variant="primary" 
          onClick={() => setScrollOpen(true)}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
          }}
        >
          Open Scrollable Modal
        </Button>
        <Modal
          isOpen={scrollOpen}
          onClose={() => setScrollOpen(false)}
          title="Terms and Conditions"
          footer={
            <Button 
              variant="primary" 
              onClick={() => setScrollOpen(false)}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                background: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              I Agree
            </Button>
          }
        >
          <div>
            {Array.from({ length: 20 }, (_, i) => (
              <p key={i} style={{ marginBottom: 'var(--space-4)' }}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            ))}
          </div>
        </Modal>
      </section>

      {/* Example 6: No Backdrop Close */}
      <section>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
          6. Modal Without Backdrop Close
        </h2>
        <Button 
          variant="primary" 
          onClick={() => setNoBackdropClose(true)} 
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'var(--accent-warning)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
          }}
        >
          Open Important Modal
        </Button>
        <Modal
          isOpen={noBackdropClose}
          onClose={() => setNoBackdropClose(false)}
          title="Important Notice"
          closeOnBackdropClick={false}
          footer={
            <Button 
              variant="primary" 
              onClick={() => setNoBackdropClose(false)}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                background: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              Acknowledge
            </Button>
          }
        >
          <p>This modal requires explicit acknowledgment. You cannot close it by clicking outside.</p>
        </Modal>
      </section>
    </div>
  );
}

export default ModalExamples;
