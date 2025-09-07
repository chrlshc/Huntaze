'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';

type Props = {
  type?: 'phone' | 'desktop';
  src?: string; // image src inside the screen
  alt?: string;
  videoSrc?: string; // optional WebM/MP4
  poster?: string;
  className?: string;
};

export default function DeviceMockup({ type = 'phone', src, alt = 'App preview', videoSrc, poster, className = '' }: Props) {
  if (type === 'desktop') return <DesktopMockup src={src} alt={alt} videoSrc={videoSrc} poster={poster} className={className} />;
  return <PhoneMockup src={src} alt={alt} videoSrc={videoSrc} poster={poster} className={className} />;
}

function PhoneMockup({ src, alt, videoSrc, poster, className }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          vid.play().catch(() => {});
        } else {
          vid.pause();
        }
      });
    }, { rootMargin: '100px' });
    io.observe(vid);
    return () => io.disconnect();
  }, []);

  return (
    <div className={`relative mx-auto iphone-mockup-css ${className}`} aria-label="iPhone mockup">
      <div className="iphone-frame relative rounded-[32px] bg-neutral-900 shadow-2xl p-2 w-[300px] h-[620px]">
        <div className="notch absolute left-1/2 -translate-x-1/2 top-0 w-40 h-6 bg-neutral-900 rounded-b-2xl" />
        <div className="iphone-screen relative rounded-3xl overflow-hidden bg-white w-full h-full">
          {videoSrc ? (
            <video
              ref={videoRef}
              muted
              playsInline
              loop
              preload="none"
              poster={poster}
              className="w-full h-full object-cover"
            >
              <source src={videoSrc} type="video/webm" />
            </video>
          ) : (
            src ? (
              <Image src={src as string} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 260px, 300px" />
            ) : null
          )}
        </div>
      </div>
      <style jsx>{`
        .iphone-mockup-css { perspective: 1000px; }
        .iphone-frame { transform: rotateY(-12deg) rotateX(4deg); transition: transform .3s ease; }
        .iphone-frame:hover { transform: rotateY(-6deg) rotateX(2deg) scale(1.03); }
      `}</style>
    </div>
  );
}

function DesktopMockup({ src, alt, videoSrc, poster, className }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) vid.play().catch(() => {});
        else vid.pause();
      });
    }, { rootMargin: '100px' });
    io.observe(vid);
    return () => io.disconnect();
  }, []);

  return (
    <div className={`relative desktop-mockup-css ${className}`} aria-label="Desktop mockup">
      <div className="rounded-xl bg-neutral-900 shadow-2xl p-3 w-full max-w-3xl mx-auto">
        <div className="h-4 w-24 rounded-full bg-neutral-800 mx-auto mb-2" />
        <div className="rounded-lg overflow-hidden bg-white aspect-video">
          {videoSrc ? (
            <video ref={videoRef} muted playsInline loop preload="none" poster={poster} className="w-full h-full object-cover">
              <source src={videoSrc} type="video/webm" />
            </video>
          ) : (
            src ? <Image src={src as string} alt={alt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 900px" /> : null
          )}
        </div>
      </div>
      <style jsx>{`
        .desktop-mockup-css { perspective: 1200px; }
        .desktop-mockup-css > div { transform: rotateY(-8deg); transition: transform .3s ease; }
        .desktop-mockup-css > div:hover { transform: rotateY(-4deg) scale(1.02); }
      `}</style>
    </div>
  );
}
