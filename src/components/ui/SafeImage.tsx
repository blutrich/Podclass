import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

export function SafeImage({ src, alt, className, ...props }: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  
  // Convert HTTP URLs to HTTPS and handle special cases
  const getSecureUrl = (url: string) => {
    try {
      // Handle empty or invalid URLs
      if (!url) return '';
      
      // Convert HTTP to HTTPS
      let secureUrl = url.replace(/^http:/, 'https:');
      
      // Handle special cases for known problematic domains
      if (secureUrl.includes('tunegocioenlanube.net')) {
        return '/placeholder-podcast.png'; // Fallback to local placeholder
      }
      
      if (secureUrl.includes('sounder.fm')) {
        return '/placeholder-podcast.png'; // Fallback to local placeholder
      }
      
      return secureUrl;
    } catch (error) {
      console.error('Error processing image URL:', error);
      return '/placeholder-podcast.png';
    }
  };

  const secureUrl = getSecureUrl(src);
  
  if (hasError || !secureUrl) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${className}`}>
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