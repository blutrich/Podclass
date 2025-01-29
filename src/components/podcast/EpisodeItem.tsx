import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileText, Play, Pause, Plus } from "lucide-react";
import { format } from "date-fns";

interface EpisodeItemProps {
  episode: {
    id: string;
    title: string;
    audioUrl: string;
    duration?: string;
    publishedAt?: string;
    description?: string;
  };
  isPlaying: boolean;
  currentAudioUrl: string | null;
  onPlay: (audioUrl: string) => void;
  onViewEpisode: (episode: any) => void;
  onAddToQueue?: (episode: any) => void;
}

export const EpisodeItem = ({ 
  episode, 
  isPlaying, 
  currentAudioUrl, 
  onPlay, 
  onViewEpisode,
  onAddToQueue
}: EpisodeItemProps) => {
  return (
    <div className="p-4 hover:bg-secondary/50 transition-colors">
      <div className="flex flex-col gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          <h4 className="text-base font-medium leading-tight">{episode.title}</h4>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {episode.duration && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{episode.duration}</span>
              </div>
            )}
            {episode.publishedAt && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(episode.publishedAt), 'MMM d, yyyy')}</span>
              </div>
            )}
          </div>
          {episode.description && (
            <div 
              className="text-sm text-muted-foreground line-clamp-3"
              dangerouslySetInnerHTML={{ __html: episode.description }}
            />
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onPlay(episode.audioUrl)}
            className="h-10 w-10 flex-shrink-0"
          >
            {isPlaying && currentAudioUrl === episode.audioUrl ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
          <Button
            size="default"
            variant="default"
            onClick={() => onViewEpisode(episode)}
            className="flex-1 min-w-0"
          >
            <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">View Episode</span>
          </Button>
          {onAddToQueue && (
            <Button
              size="icon"
              variant="outline"
              onClick={() => onAddToQueue(episode)}
              className="flex-shrink-0"
              title="Add to queue"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};