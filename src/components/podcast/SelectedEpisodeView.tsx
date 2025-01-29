import React from 'react';
import { Button } from "@/components/ui/button";
import { AudioPlayer } from "./AudioPlayer";

interface SelectedEpisodeViewProps {
  episode: {
    id: string;
    name: string;
    transcript?: string;
  };
  currentAudioUrl: string | null;
  isPlaying: boolean;
  onBack: () => void;
  setIsPlaying: (playing: boolean) => void;
}

export const SelectedEpisodeView = ({
  episode,
  currentAudioUrl,
  isPlaying,
  onBack,
  setIsPlaying
}: SelectedEpisodeViewProps) => {
  // Create a handler that matches AudioPlayer's expected signature
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4"
      >
        ← Back to podcasts
      </Button>
      <h3 className="text-2xl font-semibold mb-4">{episode.name}</h3>
      {currentAudioUrl && (
        <AudioPlayer
          audioUrl={currentAudioUrl}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
        />
      )}
    </div>
  );
};