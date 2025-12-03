import { useRef, useEffect } from 'react';
import { SmartImage } from './SmartImage';

interface ParallaxImageProps {
  src: string;
  alt?: string;
  className?: string;
  intensity?: number; // px multiplier
  fit?: 'cover' | 'contain';
  backgroundClass?: string;
}

export function ParallaxImage({ src, alt = '', className = '', intensity = 18, fit = 'cover', backgroundClass }: ParallaxImageProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const animRef = useRef<number | null>(null);
  const stateRef = useRef({ tx: 0, ty: 0 });

  useEffect(() => {
  const wrap = wrapRef.current;
  if (!wrap) return;

    function onPointerMove(e: PointerEvent) {
      const wr = wrapRef.current;
      if (!wr) return;
      const rect = wr.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2); // -1..1
      const dy = (e.clientY - cy) / (rect.height / 2);
      stateRef.current.tx = dx * intensity;
      stateRef.current.ty = dy * intensity;
      schedule();
    }

    function onPointerLeave() {
      stateRef.current.tx = 0;
      stateRef.current.ty = 0;
      schedule();
    }

    function onDeviceOrientation(ev: DeviceOrientationEvent) {
      if (ev.gamma === null || ev.beta === null) return;
      // gamma: left-to-right [-90,90], beta: front-back [-180,180]
      const dx = (ev.gamma / 30); // normalize
      const dy = (ev.beta / 30);
      stateRef.current.tx = dx * intensity;
      stateRef.current.ty = dy * intensity;
      schedule();
    }

    function schedule() {
      if (animRef.current) return;
      animRef.current = requestAnimationFrame(() => {
        animRef.current = null;
        const imgEl = imgRef.current;
        if (!imgEl) return;
        const { tx, ty } = stateRef.current;
        // subtle rotate based on tx/ty
        const rotX = (-ty / intensity) * 6; // degrees
        const rotY = (tx / intensity) * 6;
        imgEl.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      });
    }

    wrap.addEventListener('pointermove', onPointerMove);
    wrap.addEventListener('pointerleave', onPointerLeave);
    // device orientation (mobile)
    window.addEventListener('deviceorientation', onDeviceOrientation as any, true);

    return () => {
      wrap.removeEventListener('pointermove', onPointerMove);
      wrap.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('deviceorientation', onDeviceOrientation as any, true);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [intensity]);

  return (
    <div
      ref={wrapRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ perspective: 900, transformStyle: 'preserve-3d' }}
    >
      {/* underlying SmartImage handles loading/placeholder */}
      <div
        ref={imgRef as any}
        className="w-full h-full"
        style={{ transform: 'translate3d(0,0,0)', transition: 'transform 300ms ease-out', willChange: 'transform' }}
      >
        <SmartImage src={src} alt={alt} className="w-full h-full" fit={fit} backgroundClass={backgroundClass ?? (fit === 'contain' ? 'bg-black' : 'bg-gray-100')} />
      </div>
    </div>
  );
}
