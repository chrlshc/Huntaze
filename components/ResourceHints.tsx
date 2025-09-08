export default function ResourceHints() {
  return (
    <>
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://api.huntaze.com" />
      
      {/* DNS prefetch for less critical domains */}
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      
      {/* Preload critical fonts */}
      <link
        rel="preload"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
        as="style"
      />
      
      {/* Preload critical CSS */}
      <link
        rel="preload"
        href="/styles/critical.css"
        as="style"
      />
      
      {/* Prefetch next page resources */}
      <link rel="prefetch" href="/features" />
      <link rel="prefetch" href="/pricing" />
      
      {/* Resource hints for images */}
      <link rel="preload" as="image" href="/og-image.png" media="(max-width: 0px)" />
    </>
  );
}