/**
 * PlatformStatusSkeleton Component
 * 
 * Skeleton loading state for the platform status section on the home page.
 * Matches the structure of PlatformStatus component.
 * 
 * Requirements: 10.1, 10.2, 10.3
 * @see .kiro/specs/beta-launch-ui-system/requirements.md
 */

export function PlatformStatusSkeleton() {
  return (
    <div className="platform-status-section">
      <div className="section-header">
        <div className="skeleton-text skeleton-text-lg" style={{ width: '200px', height: '24px' }} />
        <div className="skeleton-text skeleton-text-sm" style={{ width: '80px', height: '20px' }} />
      </div>

      <div className="platform-status-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="platform-status-card skeleton">
            <div className="platform-status-header">
              <div className="platform-info">
                <div className="skeleton-text skeleton-text-base" style={{ width: '100px', height: '20px', marginBottom: '4px' }} />
                <div className="skeleton-text skeleton-text-sm" style={{ width: '120px', height: '16px' }} />
              </div>
              <div className="platform-status-indicator">
                <div className="skeleton-text" style={{ width: '12px', height: '12px', borderRadius: '50%' }} />
                <div className="skeleton-text skeleton-text-sm" style={{ width: '80px', height: '16px', marginLeft: '8px' }} />
              </div>
            </div>

            <div className="platform-status-footer">
              <div className="skeleton-text skeleton-text-xs" style={{ width: '140px', height: '14px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
