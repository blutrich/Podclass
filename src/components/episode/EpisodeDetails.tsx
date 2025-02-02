import { Radio } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";

interface EpisodeDetailsProps {
  episode: {
    name: string;
    podcast?: {
      name?: string;
      image_url?: string;
      description?: string;
    };
  };
  className?: string;
}

export function EpisodeDetails({ episode, className }: EpisodeDetailsProps) {
  // ... existing code ...
  return (
    <Card className={cn("overflow-hidden w-full", className)}>
      <CardHeader className="border-b bg-muted/50 p-4">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {episode.podcast?.image_url && (
            <div className="w-full sm:w-auto flex justify-center">
              <SafeImage
                src={episode.podcast.image_url}
                alt={episode.podcast.name || "Podcast cover"}
                className="h-40 w-40 sm:h-32 sm:w-32 rounded-lg object-cover shadow-md"
              />
            </div>
          )}
          <div className="flex-1 space-y-2 w-full">
            <CardTitle className="text-xl font-bold leading-tight break-words">
              {episode.name}
            </CardTitle>
            {episode.podcast?.name && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Radio className="h-4 w-4 flex-shrink-0" />
                <span className="break-words">{episode.podcast.name}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 p-4">
        {/* Episode Metadata */}
        <div className="flex flex-wrap gap-3 text-sm">
          {/* ... existing metadata items ... */}
        </div>
      </CardContent>
    </Card>
  );
} 