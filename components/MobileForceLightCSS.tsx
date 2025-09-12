'use client';

export default function MobileForceLightCSS() {
  if (typeof window !== 'undefined' && window.innerWidth <= 767) {
    return (
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* INLINE MOBILE OVERRIDE - MAXIMUM PRIORITY */
            html, body {
              background-color: white !important;
              color: #111827 !important;
            }
            
            body * {
              background-color: transparent !important;
              background-image: none !important;
            }
            
            h1, h2, h3, h4, h5, h6 {
              color: #111827 !important;
            }
            
            p, span, div, li, a, td, th {
              color: #374151 !important;
            }
            
            .bg-black,
            .bg-gray-950,
            .bg-gray-900,
            [class*="bg-black"],
            [class*="bg-gray-9"] {
              background-color: white !important;
            }
            
            .text-white,
            .text-gray-100,
            .text-gray-200,
            .text-gray-300,
            [class*="text-white"],
            [class*="text-gray-1"],
            [class*="text-gray-2"],
            [class*="text-gray-3"] {
              color: #374151 !important;
            }
            
            nav, header {
              background-color: white !important;
              color: #374151 !important;
            }
            
            button, a.btn {
              min-height: 48px !important;
            }
            
            a:not(.btn) {
              color: #7c3aed !important;
            }
            
            /* Gradient buttons preserved */
            [class*="from-purple"][class*="to-pink"] {
              background: linear-gradient(to right, #9333ea, #ec4899) !important;
              color: white !important;
            }
          `,
        }}
      />
    );
  }
  return null;
}