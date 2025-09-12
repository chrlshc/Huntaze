"use client";

import { useEffect, useRef } from "react";

type Props = {
  className?: string;
  /** 0.5 (léger) – 1 (par défaut) – 2 (dense) */
  intensity?: number;
  /** Couleur principale */
  color?: string;
};

type Path = {
  pts: { x: number; y: number }[];
  len: number; // longueur totale du chemin
};

export default function NeonCircuit({
  className,
  intensity = 1,
  color = "#a855f7", // violet tailwind (purple-500)
}: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d", { alpha: true })!;

    let width = 0;
    let height = 0;
    let raf = 0;
    let running = true;
    let paths: Path[] = [];
    const t0 = performance.now();

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Cap DPI pour la perf (mobile compris)
    const getDPR = () => Math.min(window.devicePixelRatio || 1, 1.75);

    const isMobile = () => window.innerWidth < 768;

    function rand(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    function resize() {
      const dpr = getDPR();
      const { clientWidth, clientHeight } = canvas.parentElement!;
      width = Math.max(1, clientWidth);
      height = Math.max(1, clientHeight);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildPaths(); // régénère la géométrie en fonction de la taille
    }

    function buildPaths() {
      paths = [];
      const baseCols = Math.max(8, Math.floor(width / 120));
      const baseRows = Math.max(8, Math.floor(height / 80));

      const cols =
        Math.round(baseCols * (isMobile() ? 0.8 : 1) * intensity) || 10;
      const rows =
        Math.round(baseRows * (isMobile() ? 0.9 : 1) * intensity) || 10;

      // positions en X
      const xs: number[] = [];
      for (let i = 0; i < cols; i++) {
        const x =
          (i / (cols - 1)) * width +
          rand(-width * 0.015, width * 0.015); // léger jitter
        xs.push(x);
      }

      // Pour chaque colonne, on fabrique un chemin vertical "en dents de scie"
      for (let c = 0; c < cols; c++) {
        const pts: { x: number; y: number }[] = [];
        let x = xs[c];
        for (let r = 0; r <= rows; r++) {
          const y = (r / rows) * height;
          // Petites ruptures latérales pour rappeler les facettes de la scène
          if (r > 0 && Math.random() < 0.35) {
            x += (Math.random() < 0.5 ? -1 : 1) * rand(8, 28);
          }
          pts.push({ x, y });
        }
        // Longueur du chemin
        let L = 0;
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i],
            b = pts[i + 1];
          L += Math.hypot(b.x - a.x, b.y - a.y);
        }
        paths.push({ pts, len: L });

        // Parfois, un chemin "double" très proche pour densifier visuellement
        if (Math.random() < 0.3) {
          const offset = rand(3, 8) * (Math.random() < 0.5 ? -1 : 1);
          const pts2 = pts.map((p) => ({ x: p.x + offset, y: p.y }));
          let L2 = 0;
          for (let i = 0; i < pts2.length - 1; i++) {
            const a = pts2[i],
              b = pts2[i + 1];
            L2 += Math.hypot(b.x - a.x, b.y - a.y);
          }
          paths.push({ pts: pts2, len: L2 });
        }
      }
    }

    function strokePath(p: Path) {
      const pts = p.pts;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }

    function drawSweep(t: number) {
      // Balayage diagonal façon "scanneur"
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.translate(width / 2, height / 2);
      ctx.rotate(-Math.PI / 6); // ~ -30°
      const w = width * 1.8;
      const h = height * 1.8;

      const g = ctx.createLinearGradient(-w, 0, w, 0);
      // position du faisceau qui se déplace lentement
      const x = ((t * 0.06) % 2) * 1 - 0.5; // -0.5 -> 1.5
      const center = (x + 0.5) * 1.0; // 0 -> 1

      const toRGBA = (hex: string, a: number) =>
        `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(
          hex.slice(3, 5),
          16
        )},${parseInt(hex.slice(5, 7), 16)},${a})`;

      g.addColorStop(Math.max(0, center - 0.08), toRGBA(color, 0.0));
      g.addColorStop(Math.max(0, center - 0.02), toRGBA(color, 0.22));
      g.addColorStop(center, toRGBA("#c084fc", 0.35));
      g.addColorStop(Math.min(1, center + 0.02), toRGBA(color, 0.22));
      g.addColorStop(Math.min(1, center + 0.08), toRGBA(color, 0.0));

      ctx.fillStyle = g;
      ctx.fillRect(-w, -h, w * 2, h * 2);
      ctx.restore();
    }

    function draw(time: number) {
      if (!running) return;

      const t = (time - t0) / 1000;

      // léger voile foncé pour la "persistence" + éviter le clear 100% (look plus doux)
      ctx.fillStyle = "rgba(5, 2, 15, 0.28)";
      ctx.fillRect(0, 0, width, height);

      // Base : traits statiques subtils
      ctx.save();
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;

      // micro scintillement
      const flicker =
        0.6 + 0.4 * Math.abs(Math.sin(t * 0.8 + Math.cos(t * 0.3)));
      ctx.globalAlpha = 0.18 * flicker;

      ctx.strokeStyle = color;
      ctx.setLineDash([]);

      for (const p of paths) strokePath(p);
      ctx.restore();

      // Pulses qui glissent le long de certains chemins
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      for (let i = 0; i < paths.length; i++) {
        if (i % 2 !== 0) continue; // 1/2 des chemins seulement
        const p = paths[i];

        // Paramètres par chemin (légère variation)
        const pulseLen = Math.max(24, Math.min(80, p.len * 0.08));
        const gap = p.len + pulseLen * 2; // garantit un seul dash par cycle
        const speed = 40 + (i % 7) * 12; // px/s
        const phase = (i * 137) % gap;
        const offset = -((t * speed + phase) % gap);

        ctx.setLineDash([pulseLen, gap]);
        ctx.lineDashOffset = offset;

        ctx.lineWidth = 2.2;
        ctx.shadowColor = "#d8b4fe";
        ctx.shadowBlur = 24;
        ctx.strokeStyle = "#d8b4fe"; // violet clair
        ctx.globalAlpha = 0.85;

        strokePath(p);
      }
      ctx.restore();

      // Balayage diagonal
      drawSweep(t);

      raf = requestAnimationFrame(draw);
    }

    // Pause si le canvas sort du viewport
    const io = new IntersectionObserver(
      (entries) => {
        const inView = entries[0]?.isIntersecting ?? true;
        if (inView && !raf && running && !prefersReducedMotion) {
          raf = requestAnimationFrame(draw);
        } else if ((!inView || prefersReducedMotion) && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { threshold: 0.01 }
    );
    io.observe(canvas);

    // init
    resize();
    window.addEventListener("resize", resize);

    // si l'utilisateur préfère moins d'animations : rendu statique
    if (!prefersReducedMotion) {
      raf = requestAnimationFrame(draw);
    } else {
      // frame statique
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(5, 2, 15, 1)";
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = color;
      for (const p of paths) strokePath(p);
    }

    return () => {
      running = false;
      window.removeEventListener("resize", resize);
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [color, intensity]);

  return (
    <div
      className={`
        ${className ?? ""}
        pointer-events-none absolute inset-0
        [mask-image:radial-gradient(1200px_1200px_at_60%_30%,#000_40%,transparent_85%)]
      `}
      aria-hidden
    >
      <canvas ref={ref} className="block w-full h-full" />
    </div>
  );
}