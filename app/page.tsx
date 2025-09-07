// Force new deployment v3 - Premium homepage with animations
// Deploy timestamp: 2025-09-07 13:45 UTC
// TEST: This should show the premium page with 3D animations
import HomePagePremium from './page-premium';

export default function HomePage() {
  console.log('🚀 Loading PREMIUM homepage with animations');
  return (
    <>
      {/* VISIBLE TEST BANNER - Remove after confirming deployment */}
      <div style={{ background: 'red', color: 'white', padding: '10px', textAlign: 'center', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
        🚀 PREMIUM VERSION DEPLOYED - {new Date().toISOString()}
      </div>
      <HomePagePremium />
    </>
  );
}
// Using premium homepage with all animations
