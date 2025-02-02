import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

export function SafeImage({ src, alt, className, ...props }: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  
  // Convert HTTP URLs to HTTPS
  const secureUrl = src?.replace(/^http:/, 'https:');
  
  if (hasError) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[100px] bg-muted rounded-lg">
        <ImageOff className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={secureUrl}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
      {...props}
    />
  );
} 