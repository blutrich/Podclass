import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { PodcastHeader } from "./podcast/PodcastHeader";
import { EpisodesList } from "./podcast/EpisodesList";

interface PodcastPreviewProps {
  podcast: {
    title: string;
    author: string;
    image: string;
    description?: string;
    id: string;
    taddyTranscribeStatus?: boolean;
  };
  isOpen: boolean;
  onClose: () => void;
  onSelect: () => void;
  episodes?: any[];
  isLoadingEpisodes?: boolean;
  onPlayEpisode?: (audioUrl: string) => void;
  currentlyPlaying?: {
    isPlaying: boolean;
    audioUrl: string | null;
  };
}

export function PodcastPreview({ 
  podcast, 
  isOpen, 
  onClose, 
  onSelect,
  episodes = [],
  isLoadingEpisodes = false,
  onPlayEpisode,
  currentlyPlaying = { isPlaying: false, audioUrl: null }
}: PodcastPreviewProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleViewEpisode = async (episode: any) => {
    try {
      // Generate proper UUID v4 format
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      // First store the podcast
      const podcastData = {
        id: generateUUID(),
        name: podcast.title,
        description: podcast.description,
        image_url: podcast.image
      };
      console.log('Storing podcast:', podcastData);

      const { error: podcastError } = await supabase
        .from('podcasts')
        .upsert(podcastData);

      if (podcastError) {
        console.error('Error storing podcast:', podcastError);
        throw podcastError;
      }

      // Then store the episode
      const episodeData = {
        id: generateUUID(),
        name: episode.title,
        audio_url: episode.audioUrl,
        podcast_id: podcastData.id,
        description: episode.description
      };
      console.log('Storing episode:', episodeData);

      const { error: episodeError } = await supabase
        .from('episodes')
        .upsert(episodeData);

      if (episodeError) {
        console.error('Error storing episode:', episodeError);
        throw episodeError;
      }

      // Close the drawer/dialog first
      onClose();

      // Wait for the drawer to close before navigating
      setTimeout(() => {
        console.log('Navigating to episode:', episodeData.id);
        navigate(`/episode/${episodeData.id}`);
      }, isMobile ? 500 : 0); // Increased delay for mobile

    } catch (error) {
      console.error("Error storing episode:", error);
      toast({
        title: "Error",
        description: "Failed to store episode details. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="h-[85vh] overflow-hidden">
          <DrawerHeader className="border-b">
            <DrawerTitle>{podcast.title}</DrawerTitle>
            <DrawerDescription>{podcast.author}</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col h-[calc(85vh-4rem)] overflow-hidden">
            <div className="p-4 space-y-4 overflow-y-auto">
              <PodcastHeader
                title={podcast.title}
                author={podcast.author}
                imageUrl={podcast.image}
                description={podcast.description}
              />
              {podcast.taddyTranscribeStatus && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-2 rounded-md">
                  <FileText className="h-4 w-4" />
                  <span>Transcript available</span>
                </div>
              )}
              <EpisodesList
                podcastId={podcast.id}
                episodes={episodes}
                isLoading={isLoadingEpisodes}
                currentlyPlaying={currentlyPlaying}
                onPlayEpisode={onPlayEpisode || (() => {})}
                onViewEpisode={handleViewEpisode}
              />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px] h-[90vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl">{podcast.title}</DialogTitle>
          <DialogDescription className="text-base">{podcast.author}</DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-[250px,1fr] gap-6 p-6 h-[calc(90vh-100px)] overflow-hidden">
          <div className="space-y-4 overflow-y-auto">
            <PodcastHeader
              title={podcast.title}
              author={podcast.author}
              imageUrl={podcast.image}
              description={podcast.description}
            />
            {podcast.taddyTranscribeStatus && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-2 rounded-md">
                <FileText className="h-4 w-4" />
                <span>Transcript available</span>
              </div>
            )}
          </div>

          <div className="overflow-y-auto pr-2">
            <EpisodesList
              podcastId={podcast.id}
              episodes={episodes}
              isLoading={isLoadingEpisodes}
              currentlyPlaying={currentlyPlaying}
              onPlayEpisode={onPlayEpisode || (() => {})}
              onViewEpisode={handleViewEpisode}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}