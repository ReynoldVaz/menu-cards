import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
}

export function Starfield({
  density = 0.00035,
  speed = 0.6,
  className = '',
  maxStars,
}: {
  density?: number; // stars per pixel
  speed?: number; // base forward speed
  className?: string;
  maxStars?: number; // clamp upper bound
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const depthRef = useRef<number>(1);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    function resize() {
      const parent = canvas.parentElement || document.body;
      let w = parent.clientWidth;
      let h = parent.clientHeight;

      // Fallback if parent hasn't sized yet (absolute containers sometimes 0 early)
      if (!w || !h) {
        w = window.innerWidth;
        h = window.innerHeight;
      }

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Depth ties to the larger dimension for nicer perspective
      depthRef.current = Math.max(w, h);

      // Rebuild stars for new size
      const area = w * h;
      const count = Math.min(maxStars ?? 900, Math.max(150, Math.floor(area * density)));
      starsRef.current = new Array(count).fill(0).map(() => newStar(w, h, depthRef.current));
    }

    function newStar(w: number, h: number, depth: number): Star {
      // Distribute around center to give a "coming at you" feel
      const cx = w / 2;
      const cy = h / 2;
      return {
        x: (Math.random() - 0.5) * w * 1.6, // wider spawn for better spread
        y: (Math.random() - 0.5) * h * 1.6,
        z: Math.random() * depth + 1,
      };
    }

    function draw() {
      if (!runningRef.current) return;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const cx = w / 2;
      const cy = h / 2;
      const depth = depthRef.current;

      ctx.clearRect(0, 0, w, h);

      const fov = 220; // projection scale
      const baseSpeed = speed; // user speed

      for (let i = 0; i < starsRef.current.length; i++) {
        const s = starsRef.current[i];
        s.z -= baseSpeed;
        if (s.z <= 1) {
          starsRef.current[i] = newStar(w, h, depth);
          continue;
        }

        const k = fov / s.z;
        const px = s.x * k + cx;
        const py = s.y * k + cy;

        if (px < 0 || px >= w || py < 0 || py >= h) {
          starsRef.current[i] = newStar(w, h, depth);
          continue;
        }

        // size and brightness scale as star gets closer
        const t = 1 - Math.min(1, s.z / depth);
        const size = 0.8 + t * 2.0; // 0.8px .. 2.8px
        const alpha = 0.45 + t * 0.55; // brighter overall

        ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    function onVisibility() {
      const hidden = document.hidden;
      runningRef.current = !hidden;
      if (!hidden && rafRef.current == null) {
        rafRef.current = requestAnimationFrame(draw);
      }
    }

    resize();
    rafRef.current = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [density, speed, maxStars]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.9 }}
    />
  );
}
