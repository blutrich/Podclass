import { useState } from "react";
import { ImageOff } from "lucide-react";

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
}

const FallbackImage = () => (
  <div className="flex items-center justify-center w-full h-full min-h-[100px] bg-muted rounded-lg">
    <ImageOff className="h-8 w-8 text-muted-foreground" />
  </div>
);

export function SafeImage({ src, alt, className, fallback, ...props }: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return fallback || <FallbackImage />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
      {...props}
    />
  );
} 