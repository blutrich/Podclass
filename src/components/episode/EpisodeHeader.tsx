import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { SafeImage } from "@/components/ui/safe-image";

interface EpisodeHeaderProps {
  title: string;
  podcastName?: string | null;
  imageUrl?: string | null;
}

export const EpisodeHeader: React.FC<EpisodeHeaderProps> = ({ 
  title, 
  podcastName, 
  imageUrl 
}) => {
  const [imageError, setImageError] = useState(false);
  const fallbackImage = "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=800&q=80";

  return (
    <div className="space-y-4 md:space-y-6">
      {imageUrl && !imageError && (
        <Card className="md:max-w-md">
          <CardContent className="p-0">
            <div className="aspect-square md:aspect-video relative overflow-hidden rounded-lg">
              <SafeImage
                src={imageUrl}
                alt={podcastName || "Podcast cover"}
                className="object-cover w-full h-full"
                onError={(e) => {
                  console.error("Image failed to load:", imageUrl);
                  setImageError(true);
                  e.currentTarget.src = fallbackImage;
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
      
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
        {podcastName && (
          <p className="text-muted-foreground">{podcastName}</p>
        )}
      </div>
    </div>
  );
};