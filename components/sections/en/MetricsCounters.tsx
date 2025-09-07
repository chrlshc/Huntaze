'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

const METRICS = [
  { label: 'Revenue kept', target: 98, suffix: '%', color: 'from-green-400 to-emerald-500' },
  { label: 'Avg. growth in 90 days', target: 3.2, suffix: '×', color: 'from-purple-400 to-pink-500' },
  { label: 'Hours saved / week', target: 20, suffix: 'h', color: 'from-blue-400 to-cyan-500' },
  { label: 'Active creators', target: 10847, suffix: '', color: 'from-amber-400 to-orange-500' },
];

export default function MetricsCountersEN() {
  return (
    <section className="py-16 bg-gradient-to-b from-gray-950 to-black text-white">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
        {METRICS.map((m) => (
          <CounterCard key={m.label} {...m} />
        ))}
      </div>
    </section>
  );
}

function CounterCard({ label, target, suffix, color }: { label: string; target: number; suffix: string; color: string }) {
  const val = useSpring(0, { stiffness: 80, damping: 20 });
  useEffect(() => { val.set(target); }, [target, val]);

  return (
    <div className="rounded-xl border border-white/10 p-6 text-center">
      <div className={`text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r ${color}`}>
        <AnimatedNumber spring={val} suffix={suffix} integer={Number.isInteger(target)} />
      </div>
      <p className="text-sm text-gray-400 mt-2">{label}</p>
    </div>
  );
}

function AnimatedNumber({ spring, suffix, integer }: { spring: any; suffix: string; integer: boolean }) {
  const [value, setValue] = useState(0);
  useEffect(() => spring.on('change', (v: number) => setValue(v)), [spring]);
  const displayed = integer ? Math.round(value).toString() : value.toFixed(1);
  return <span>{displayed}{suffix}</span>;
}
