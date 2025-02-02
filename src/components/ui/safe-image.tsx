import { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

export function SafeImage({ src, alt, className, ...props }: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [secureUrl, setSecureUrl] = useState<string>('');
  
  useEffect(() => {
    const processImageUrl = (url: string) => {
      try {
        // Handle empty or invalid URLs
        if (!url) {
          setHasError(true);
          return '';
        }

        // Convert HTTP to HTTPS
        let processedUrl = url.replace(/^http:/, 'https:');

        // Handle problematic domains
        const problematicDomains = [
          'tunegocioenlanube.net',
          'sounder.fm',
          'buzzsprout.com',
          'toginet.com'
        ];

        if (problematicDomains.some(domain => processedUrl.includes(domain))) {
          setHasError(true);
          return '/placeholder-podcast.png';
        }

        // Handle relative URLs
        if (processedUrl.startsWith('/')) {
          processedUrl = `${window.location.origin}${processedUrl}`;
        }

        return processedUrl;
      } catch (error) {
        console.error('Error processing image URL:', error);
        setHasError(true);
        return '/placeholder-podcast.png';
      }
    };

    setSecureUrl(processImageUrl(src));
  }, [src]);

  const handleImageError = () => {
    console.warn('Image failed to load:', src);
    setHasError(true);
  };
  
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
      onError={handleImageError}
      loading="lazy"
      {...props}
    />
  );
} 