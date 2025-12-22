'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ENABLE_MOCK_DATA } from '@/lib/config/mock-data';
import { EmptyState } from '@/components/ui/EmptyState';

type AudienceType = 'all' | 'vip' | 'active' | 'top_spenders';
type StatusType = 'draft' | 'active';

const polarisColors = {
  bgApp: 'rgba(241, 241, 241, 1)',
  bgSurface: 'rgba(255, 255, 255, 1)',
  bgSurfaceSecondary: 'rgba(246, 246, 247, 1)',
  text: 'rgba(48, 48, 48, 1)',
  textSubdued: 'rgba(97, 97, 97, 1)',
  border: 'rgba(227, 227, 227, 1)',
  borderSubdued: 'rgba(235, 235, 235, 1)',
  borderHover: 'rgba(204, 204, 204, 1)',
  focus: 'rgba(0, 91, 211, 1)',
  actionPrimary: 'rgba(0, 128, 96, 1)',
  actionPrimaryHover: 'rgba(0, 110, 82, 1)',
  critical: 'rgba(215, 44, 13, 1)',
};

const polarisShadow = '0px 4px 6px -2px rgba(26, 26, 26, 0.20)';

function PolarisCard({
  title,
  children,
}: {
  title?: string | null;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        backgroundColor: polarisColors.bgSurface,
        borderRadius: '8px',
        boxShadow: polarisShadow,
        border: `1px solid ${polarisColors.border}`,
        overflow: 'hidden',
      }}
    >
      {title && (
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${polarisColors.borderSubdued}`,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 600,
              color: polarisColors.text,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            }}
          >
            {title}
          </h2>
        </div>
      )}
      <div style={{ padding: '16px' }}>{children}</div>
    </section>
  );
}

function PolarisButton({
  variant = 'secondary',
  children,
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  form,
}: {
  variant?: 'primary' | 'secondary' | 'plain';
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  onClick?: (e: React.MouseEvent) => void;
  form?: string;
}) {
  const isDisabled = disabled || loading;
  
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '36px',
    padding: '0 16px',
    fontSize: '14px',
    fontWeight: 500,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    borderRadius: '6px',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.5 : 1,
    transition: 'all 150ms ease',
    border: 'none',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: polarisColors.actionPrimary,
      color: 'white',
    },
    secondary: {
      backgroundColor: polarisColors.bgSurface,
      color: polarisColors.text,
      border: `1px solid ${polarisColors.border}`,
    },
    plain: {
      backgroundColor: 'transparent',
      color: polarisColors.focus,
      padding: '0 8px',
    },
  };

  return (
    <button
      type={type}
      form={form}
      disabled={isDisabled}
      onClick={onClick}
      style={{ ...baseStyle, ...variantStyles[variant] }}
    >
      {loading ? 'Saving...' : children}
    </button>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 500,
  color: polarisColors.text,
  marginBottom: '4px',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
};

const helpTextStyle: React.CSSProperties = {
  fontSize: '12px',
  color: polarisColors.textSubdued,
  marginTop: '4px',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '36px',
  padding: '0 12px',
  fontSize: '14px',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  color: polarisColors.text,
  backgroundColor: polarisColors.bgSurface,
  border: `1px solid ${polarisColors.border}`,
  borderRadius: '4px',
  outline: 'none',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: '14px',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  color: polarisColors.text,
  backgroundColor: polarisColors.bgSurface,
  border: `1px solid ${polarisColors.border}`,
  borderRadius: '4px',
  outline: 'none',
  resize: 'vertical',
  lineHeight: '1.5',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  height: '36px',
  padding: '0 12px',
  fontSize: '14px',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  color: polarisColors.text,
  backgroundColor: polarisColors.bgSurface,
  border: `1px solid ${polarisColors.border}`,
  borderRadius: '4px',
  outline: 'none',
  cursor: 'pointer',
};

export default function CreatePPVClient() {
  if (!ENABLE_MOCK_DATA) {
    return (
      <div className="p-6">
        <EmptyState
          variant="no-data"
          title="PPV creation isn’t available yet"
          description="This screen currently uses demo data and is disabled outside demo mode."
        />
      </div>
    );
  }

  const router = useRouter();

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const dragCounter = React.useRef(0);

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [compareAtPrice, setCompareAtPrice] = React.useState('');
  const [audience, setAudience] = React.useState<AudienceType>('all');
  const [status, setStatus] = React.useState<StatusType>('draft');
  const [file, setFile] = React.useState<File | null>(null);
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const segments = React.useMemo(
    () => [
      { value: 'all' as const, label: 'All Fans', size: 1234 },
      { value: 'vip' as const, label: 'VIP Fans', size: 234 },
      { value: 'active' as const, label: 'Active Fans', size: 567 },
      { value: 'top_spenders' as const, label: 'Top Spenders', size: 123 },
    ],
    [],
  );

  const selectedSegment = React.useMemo(
    () => segments.find((segment) => segment.value === audience) ?? null,
    [audience, segments],
  );

  const openFilePicker = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = React.useCallback((nextFile: File | null) => {
    if (!nextFile) return;
    setFile(nextFile);
  }, []);

  const handleDrop = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragCounter.current = 0;
    setIsDragActive(false);
    const droppedFile = event.dataTransfer.files?.[0] ?? null;
    if (droppedFile) setFile(droppedFile);
  }, []);

  const handleDragEnter = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragCounter.current += 1;
    setIsDragActive(true);
  }, []);

  const handleDragLeave = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setIsDragActive(false);
  }, []);

  const handleDragOver = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSubmitting) return;
      setIsSubmitting(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 600));
        router.push('/onlyfans/ppv');
      } finally {
        setIsSubmitting(false);
      }
    },
    [audience, compareAtPrice, description, file, isSubmitting, price, router, status, title],
  );

  return (
    <div
      style={{
        minHeight: '100%',
        backgroundColor: polarisColors.bgApp,
        padding: '20px 16px',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* Page Title */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 24px auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Link
            href="/onlyfans/ppv"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: polarisColors.textSubdued,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            <span>Back</span>
          </Link>
        </div>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: polarisColors.text,
            margin: 0,
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          }}
        >
          Add PPV
        </h1>
      </div>

      {/* Main Layout - 8/12 + 4/12 Grid */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
          {/* LEFT COLUMN */}
          <form id="ppv-create-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Content Card */}
            <PolarisCard title="Content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label htmlFor="ppv-title" style={labelStyle}>Title</label>
                  <input
                    id="ppv-title"
                    name="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={inputStyle}
                    placeholder="Weekend surprise 🔥"
                  />
                  <p style={helpTextStyle}>Keep it short — this is what fans see first.</p>
                </div>

                <div>
                  <label htmlFor="ppv-description" style={labelStyle}>Message</label>
                  <textarea
                    id="ppv-description"
                    name="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ ...textareaStyle, minHeight: '180px' }}
                    placeholder="What's inside + why it's worth it…"
                  />
                  <p style={helpTextStyle}>Tip: mention length, type (photo/video), and any bonus.</p>
                </div>
              </div>
            </PolarisCard>

            {/* Media Card */}
            <PolarisCard title="Media">
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={openFilePicker}
                style={{
                  cursor: 'pointer',
                  borderRadius: '8px',
                  border: `2px dashed ${isDragActive ? polarisColors.focus : polarisColors.border}`,
                  backgroundColor: isDragActive ? 'rgba(0, 91, 211, 0.05)' : polarisColors.bgSurfaceSecondary,
                  padding: '24px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '140px',
                  gap: '16px',
                  transition: 'all 150ms ease',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    handleFileSelected(e.target.files?.[0] ?? null);
                    e.currentTarget.value = '';
                  }}
                />

                {!file ? (
                  <>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <PolarisButton
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          openFilePicker();
                        }}
                      >
                        Upload new
                      </PolarisButton>
                      <PolarisButton
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          openFilePicker();
                        }}
                      >
                        Select existing
                      </PolarisButton>
                    </div>
                    <p style={{ fontSize: '12px', color: polarisColors.textSubdued, margin: 0 }}>
                      Accepts images or videos
                    </p>
                  </>
                ) : (
                  <>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: polarisColors.text, margin: 0 }}>
                        Selected media
                      </p>
                      <p style={{ fontSize: '14px', color: polarisColors.textSubdued, margin: '4px 0 0 0', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <PolarisButton
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          openFilePicker();
                        }}
                      >
                        Replace
                      </PolarisButton>
                      <PolarisButton
                        variant="plain"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                      >
                        Remove
                      </PolarisButton>
                    </div>
                  </>
                )}
              </div>
            </PolarisCard>

            {/* Pricing Card */}
            <PolarisCard title="Pricing">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label htmlFor="ppv-price" style={labelStyle}>Price</label>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '14px',
                        color: polarisColors.textSubdued,
                        pointerEvents: 'none',
                      }}
                    >
                      $
                    </span>
                    <input
                      id="ppv-price"
                      name="price"
                      inputMode="decimal"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      style={{ ...inputStyle, paddingLeft: '28px' }}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="ppv-compare-at-price" style={labelStyle}>Compare-at price</label>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '14px',
                        color: polarisColors.textSubdued,
                        pointerEvents: 'none',
                      }}
                    >
                      $
                    </span>
                    <input
                      id="ppv-compare-at-price"
                      name="compareAtPrice"
                      inputMode="decimal"
                      value={compareAtPrice}
                      onChange={(e) => setCompareAtPrice(e.target.value)}
                      style={{ ...inputStyle, paddingLeft: '28px' }}
                      placeholder="0.00"
                    />
                  </div>
                  <p style={helpTextStyle}>Optional (shows a "before" price).</p>
                </div>
              </div>
            </PolarisCard>
          </form>

          {/* RIGHT COLUMN - Sidebar */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
            {/* Status Card */}
            <PolarisCard title="Status">
              <select
                name="status"
                form="ppv-create-form"
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusType)}
                style={selectStyle}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
            </PolarisCard>

            {/* Audience Card */}
            <PolarisCard title="Audience">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Send to</label>
                  <select
                    name="audience"
                    form="ppv-create-form"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as AudienceType)}
                    style={selectStyle}
                  >
                    {segments.map((segment) => (
                      <option key={segment.value} value={segment.value}>
                        {segment.label}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedSegment && (
                  <div
                    style={{
                      borderRadius: '4px',
                      backgroundColor: polarisColors.bgSurfaceSecondary,
                      padding: '12px',
                    }}
                  >
                    <p style={{ fontSize: '12px', color: polarisColors.textSubdued, margin: 0 }}>
                      <span style={{ fontWeight: 600, color: polarisColors.text }}>{selectedSegment.size}</span> people will receive this PPV
                    </p>
                  </div>
                )}
              </div>
            </PolarisCard>

            {/* Preview Card */}
            <PolarisCard title="Preview">
              <div
                style={{
                  borderRadius: '8px',
                  backgroundColor: polarisColors.bgSurfaceSecondary,
                  padding: '16px',
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: 600, color: polarisColors.text }}>
                  {title.trim() ? title : 'Untitled PPV'}
                </div>
                <p
                  style={{
                    marginTop: '4px',
                    fontSize: '14px',
                    color: polarisColors.textSubdued,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {description.trim() ? description : "Write a short message that explains what's inside…"}
                </p>
                <div style={{ marginTop: '12px', fontSize: '12px', color: polarisColors.textSubdued }}>
                  <p style={{ margin: '0 0 4px 0' }}>{price.trim() ? `Unlock for $${price}` : 'Set a price to unlock'}</p>
                  <p style={{ margin: 0 }}>{file ? `Media: ${file.name}` : 'No media selected'}</p>
                </div>
              </div>
            </PolarisCard>
          </aside>
        </div>

        {/* Bottom Action Bar */}
        <div
          style={{
            marginTop: '24px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="submit"
            form="ppv-create-form"
            disabled={isSubmitting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '32px',
              padding: '0 12px',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'rgba(227, 227, 227, 1)',
              color: 'rgba(97, 97, 97, 1)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.5 : 1,
            }}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
