"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  a: number;
  t: number;
  ts: number;
}

/** Schwebender Goldstaub im Lichtkegel – ein Canvas, pausiert außerhalb des Sichtfelds. */
export function GoldDust({ className, density = 0.00006 }: { className?: string; density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    let raf = 0;
    let visible = true;

    const spawn = (anywhere: boolean): Particle => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 8,
      r: 0.35 + Math.random() ** 2 * 1.9,
      vx: (Math.random() - 0.5) * 0.06,
      vy: -(0.06 + Math.random() * 0.26),
      a: 0.18 + Math.random() * 0.7,
      t: Math.random() * Math.PI * 2,
      ts: 0.008 + Math.random() * 0.025,
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(110, Math.max(26, w * h * density)));
      particles = Array.from({ length: count }, () => spawn(true));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        const alpha = p.a * (0.5 + 0.5 * Math.sin(p.t));
        if (p.r > 1.2) {
          ctx.fillStyle = `rgba(233, 207, 152, ${alpha * 0.12})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(240, 220, 172, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const tick = () => {
      for (const p of particles) {
        p.t += p.ts;
        p.x += p.vx + Math.sin(p.t * 0.7) * 0.1;
        p.y += p.vy;
        if (p.y < -8 || p.x < -8 || p.x > w + 8) Object.assign(p, spawn(false));
      }
      draw();
      raf = visible ? requestAnimationFrame(tick) : 0;
    };

    resize();
    if (reduce) {
      draw();
    } else {
      raf = requestAnimationFrame(tick);
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && document.visibilityState === "visible";
      if (visible && !raf && !reduce) raf = requestAnimationFrame(tick);
    });
    io.observe(canvas);

    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      if (visible && !raf && !reduce) raf = requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", onVisibility);

    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) draw();
    });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
