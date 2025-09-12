"use client";

import { useEffect, useState } from "react";
import { useInView } from 'react-intersection-observer';
import { motion, LazyMotion, domAnimation, m } from "framer-motion";

interface LazyLoadAnimationProps {
  children: React.ReactNode;
  className?: string;
  animation?: "fade" | "slide" | "scale" | "blur";
  delay?: number;
  duration?: number;
  once?: boolean;
}

export function LazyLoadAnimation({
  children,
  className,
  animation = "fade",
  delay = 0,
  duration = 0.5,
  once = true,
}: LazyLoadAnimationProps) {
  const [hasAnimated, setHasAnimated] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: "50px",
    triggerOnce: once,
  });

  useEffect(() => {
    if (inView && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [inView, hasAnimated]);

  const variants = {
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    slide: {
      hidden: { opacity: 0, x: -30 },
      visible: { opacity: 1, x: 0 },
    },
    scale: {
      hidden: { opacity: 0, scale: 0.9 },
      visible: { opacity: 1, scale: 1 },
    },
    blur: {
      hidden: { opacity: 0, filter: "blur(10px)" },
      visible: { opacity: 1, filter: "blur(0px)" },
    },
  };

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        ref={ref}
        className={className}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={variants[animation]}
        transition={{
          duration,
          delay,
          ease: "easeOut",
        }}
        style={{
          transform: "translateZ(0)", // Force GPU
          backfaceVisibility: "hidden", // Prevent flickering
          perspective: 1000, // Create stacking context
        }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}