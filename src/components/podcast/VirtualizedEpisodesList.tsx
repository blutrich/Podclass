import { FixedSizeList as List } from 'react-window';
import { EpisodeItem } from './EpisodeItem';

export interface VirtualizedEpisodesListProps {
  episodes: any[];
  currentlyPlaying: {
    isPlaying: boolean;
    audioUrl: string | null;
  };
  onPlayEpisode: (audioUrl: string) => void;
  onViewEpisode: (episode: any) => void;
  onAddToQueue?: (episode: any) => void;
}

export const VirtualizedEpisodesList = ({
  episodes,
  currentlyPlaying,
  onPlayEpisode,
  onViewEpisode,
  onAddToQueue,
}: VirtualizedEpisodesListProps) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const episode = episodes[index];
    return (
      <div style={style}>
        <EpisodeItem
          episode={episode}
          isPlaying={currentlyPlaying.isPlaying}
          currentAudioUrl={currentlyPlaying.audioUrl}
          onPlay={onPlayEpisode}
          onViewEpisode={onViewEpisode}
          onAddToQueue={onAddToQueue}
        />
      </div>
    );
  };

  return (
    <List
      height={400}
      itemCount={episodes.length}
      itemSize={100}
      width="100%"
    >
      {Row}
    </List>
  );
};