import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Grip, X } from "lucide-react";
import { motion, Reorder } from "framer-motion";

interface QueuedEpisode {
  id: string;
  title: string;
  audioUrl: string;
  podcastName?: string;
}

interface EpisodeQueueProps {
  queue: QueuedEpisode[];
  currentEpisode: QueuedEpisode | null;
  onRemoveFromQueue: (episodeId: string) => void;
  onReorderQueue: (newQueue: QueuedEpisode[]) => void;
}

export const EpisodeQueue = ({
  queue,
  currentEpisode,
  onRemoveFromQueue,
  onReorderQueue,
}: EpisodeQueueProps) => {
  if (queue.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No episodes in queue
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <Reorder.Group
        axis="y"
        values={queue}
        onReorder={onReorderQueue}
        className="space-y-2"
      >
        {queue.map((episode) => (
          <Reorder.Item
            key={episode.id}
            value={episode}
            className="bg-card"
          >
            <motion.div
              className={`flex items-center gap-3 p-3 rounded-lg ${
                currentEpisode?.id === episode.id ? "bg-secondary" : ""
              }`}
              layout
            >
              <Grip className="h-4 w-4 text-muted-foreground cursor-grab" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium truncate">{episode.title}</h4>
                {episode.podcastName && (
                  <p className="text-xs text-muted-foreground truncate">
                    {episode.podcastName}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onRemoveFromQueue(episode.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </ScrollArea>
  );
};