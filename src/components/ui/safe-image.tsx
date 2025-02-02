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
          console.warn('Empty or invalid URL provided');
          setHasError(true);
          return '';
        }

        // Convert HTTP to HTTPS
        let processedUrl = url.replace(/^http:/, 'https:');

        // Handle problematic domains and patterns
        const problematicPatterns = [
          { pattern: /sndcdn\.com/, name: 'SoundCloud CDN' },
          { pattern: /soundcloud\.com/, name: 'SoundCloud' },
          { pattern: /i1\.sndcdn\.com/, name: 'SoundCloud CDN (i1)' },
          { pattern: /tunegocioenlanube\.net/, name: 'Tune Gocio' },
          { pattern: /sounder\.fm/, name: 'Sounder.fm' },
          { pattern: /buzzsprout\.com/, name: 'Buzzsprout' },
          { pattern: /toginet\.com/, name: 'Toginet' }
        ];

        const matchedPattern = problematicPatterns.find(({ pattern }) => 
          pattern.test(processedUrl.toLowerCase())
        );

        if (matchedPattern) {
          console.warn(`Using fallback for ${matchedPattern.name} URL: ${url}`);
          setHasError(true);
          return '/placeholder-podcast.png';
        }

        // Handle relative URLs
        if (processedUrl.startsWith('/')) {
          processedUrl = `${window.location.origin}${processedUrl}`;
        }

        return processedUrl;
      } catch (error) {
        console.error('Error processing image URL:', error, 'URL:', url);
        setHasError(true);
        return '/placeholder-podcast.png';
      }
    };

    setSecureUrl(processImageUrl(src));
  }, [src]);

  const handleImageError = () => {
    if (!hasError) {  // Prevent infinite loop
      console.warn('Image failed to load:', src);
      setHasError(true);
    }
  };
  
  if (hasError || !secureUrl) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted rounded-lg ${className}`}
        style={{ 
          minHeight: props.height || '100px',
          minWidth: props.width || '100px'
        }}
      >
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