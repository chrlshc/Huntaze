'use client';

import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';

interface MetricCounterProps {
  start?: number;
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export default function MetricCounter({
  start = 0,
  end,
  duration = 2.5,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = ''
}: MetricCounterProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true
  });

  useEffect(() => {
    if (inView) {
      setHasStarted(true);
    }
  }, [inView]);

  return (
    <span ref={ref} className={className}>
      {hasStarted ? (
        <CountUp
          start={start}
          end={end}
          duration={duration}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          separator=","
        />
      ) : (
        `${prefix}${start}${suffix}`
      )}
    </span>
  );
}