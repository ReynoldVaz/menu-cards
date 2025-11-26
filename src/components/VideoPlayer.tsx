import { useEffect, useRef } from 'react';

type VideoPlayerProps = {
  src: string;
  poster?: string;
  className?: string;
};

function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/.test(url);
}

function youTubeEmbed(url: string) {
  // extract id
  const m = url.match(/(?:v=|\/)([0-9A-Za-z_-]{6,})/);
  const id = m ? m[1] : null;
  if (!id) return url;
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
}

export function VideoPlayer({ src, poster, className = '' }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    let hls: any = null;
    if (!v) return;

    // HLS playback (m3u8) on browsers without native support
    const isHls = src.endsWith('.m3u8');
    if (isHls && typeof window !== 'undefined') {
      // dynamic import hls.js
      import('hls.js').then((Hls) => {
        const HlsLib = (Hls as any).default ?? Hls;
        if (HlsLib.isSupported()) {
          hls = new HlsLib();
          hls.loadSource(src);
          hls.attachMedia(v);
        } else {
          // fallback - set src directly and let browser try
          v.src = src;
        }
      }).catch(() => {
        v.src = src;
      });
    } else {
      // normal video file
      v.src = src;
    }

    return () => {
      if (hls && hls.destroy) hls.destroy();
    };
  }, [src]);

  if (isYouTube(src)) {
    const embed = youTubeEmbed(src);
    return (
      <div className={`w-full ${className}`}>
        <iframe
          title="video"
          src={embed}
          className="w-full h-64 sm:h-80"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      preload="metadata"
      poster={poster}
      className={`w-full h-64 sm:h-80 bg-black ${className}`}
    />
  );
}
