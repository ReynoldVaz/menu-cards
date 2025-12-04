import { useState } from 'react';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  className?: string;
  fit?: 'cover' | 'contain';
  backgroundClass?: string;
}

export function SmartImage({ src, alt = '', className = '', fit = 'cover', backgroundClass = 'bg-gray-100', ...rest }: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden ${backgroundClass} ${className}`.trim()} style={{ minWidth: 0 }}>
      {/* subtle neutral placeholder instead of blurred low-res */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-gray-200" aria-hidden />

      {/* full image */}
      <img
        src={src}
        alt={alt}
        {...rest}
        onLoad={(e) => {
          setLoaded(true);
          if (rest.onLoad) rest.onLoad && (rest.onLoad as any)(e);
        }}
        className={`relative w-full h-full ${fit === 'contain' ? 'object-contain bg-black' : 'object-cover'} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
