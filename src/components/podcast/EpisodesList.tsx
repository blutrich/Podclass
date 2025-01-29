import { ScrollArea } from "@/components/ui/scroll-area";
import { CreateEpisodeDialog } from "@/components/CreateEpisodeDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { EpisodeItem } from "./EpisodeItem";
import { VirtualizedEpisodesList } from "./VirtualizedEpisodesList";
import { motion } from "framer-motion";
import { EpisodeSkeleton } from "./EpisodeSkeleton";
import { useState } from "react";

interface QueuedEpisode {
  id: string;
  title: string;
  audioUrl: string;
  podcastName?: string;
}

interface EpisodesListProps {
  podcastId: string;
  episodes: any[];
  isLoading: boolean;
  currentlyPlaying: {
    isPlaying: boolean;
    audioUrl: string | null;
  };
  onPlayEpisode: (audioUrl: string) => void;
  onViewEpisode: (episode: any) => void;
}

const VIRTUALIZATION_THRESHOLD = 50;

export const EpisodesList = ({
  podcastId,
  episodes,
  isLoading,
  currentlyPlaying,
  onPlayEpisode,
  onViewEpisode
}: EpisodesListProps) => {
  const isMobile = useIsMobile();
  const [queue, setQueue] = useState<QueuedEpisode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<QueuedEpisode | null>(null);

  const handleAddToQueue = (episode: any) => {
    const queuedEpisode: QueuedEpisode = {
      id: episode.id,
      title: episode.title,
      audioUrl: episode.audioUrl,
      podcastName: episode.podcastName
    };
    setQueue(prevQueue => [...prevQueue, queuedEpisode]);
  };

  const handleRemoveFromQueue = (episodeId: string) => {
    setQueue(prevQueue => prevQueue.filter(ep => ep.id !== episodeId));
  };

  const handleQueueUpdate = (newQueue: QueuedEpisode[]) => {
    setQueue(newQueue);
  };

  const handleNextTrack = () => {
    if (!currentEpisode || queue.length === 0) return;
    
    const currentIndex = queue.findIndex(ep => ep.id === currentEpisode.id);
    if (currentIndex === -1 || currentIndex === queue.length - 1) return;
    
    const nextEpisode = queue[currentIndex + 1];
    setCurrentEpisode(nextEpisode);
    onPlayEpisode(nextEpisode.audioUrl);
  };

  const handlePreviousTrack = () => {
    if (!currentEpisode || queue.length === 0) return;
    
    const currentIndex = queue.findIndex(ep => ep.id === currentEpisode.id);
    if (currentIndex <= 0) return;
    
    const previousEpisode = queue[currentIndex - 1];
    setCurrentEpisode(previousEpisode);
    onPlayEpisode(previousEpisode.audioUrl);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <EpisodeSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground border rounded-md">
        No episodes available
      </div>
    );
  }

  const shouldUseVirtualization = episodes.length > VIRTUALIZATION_THRESHOLD;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Episodes</h3>
        <CreateEpisodeDialog podcastId={podcastId} />
      </div>
      
      {isMobile ? (
        <div className="flex-1 overflow-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
          {shouldUseVirtualization ? (
            <VirtualizedEpisodesList
              episodes={episodes}
              currentlyPlaying={currentlyPlaying}
              onPlayEpisode={onPlayEpisode}
              onViewEpisode={onViewEpisode}
              onAddToQueue={handleAddToQueue}
            />
          ) : (
            <motion.div 
              className="space-y-4 pb-20 px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {episodes.map((episode) => (
                <motion.div
                  key={episode.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-card rounded-lg shadow-sm"
                >
                  <EpisodeItem
                    episode={episode}
                    isPlaying={currentlyPlaying.isPlaying}
                    currentAudioUrl={currentlyPlaying.audioUrl}
                    onPlay={onPlayEpisode}
                    onViewEpisode={onViewEpisode}
                    onAddToQueue={handleAddToQueue}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      ) : (
        <ScrollArea className="flex-1 h-[calc(100vh-200px)] pr-4">
          {shouldUseVirtualization ? (
            <VirtualizedEpisodesList
              episodes={episodes}
              currentlyPlaying={currentlyPlaying}
              onPlayEpisode={onPlayEpisode}
              onViewEpisode={onViewEpisode}
              onAddToQueue={handleAddToQueue}
            />
          ) : (
            <div className="space-y-2">
              {episodes.map((episode) => (
                <div key={episode.id} className="bg-card rounded-lg shadow-sm">
                  <EpisodeItem
                    episode={episode}
                    isPlaying={currentlyPlaying.isPlaying}
                    currentAudioUrl={currentlyPlaying.audioUrl}
                    onPlay={onPlayEpisode}
                    onViewEpisode={onViewEpisode}
                    onAddToQueue={handleAddToQueue}
                  />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
};