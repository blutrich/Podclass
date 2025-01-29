import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EpisodeAudioPlayerProps {
  audioUrl: string;
}

type PlaybackSpeed = "0.5" | "0.75" | "1" | "1.25" | "1.5" | "1.75" | "2";

export const EpisodeAudioPlayer: React.FC<EpisodeAudioPlayerProps> = ({ audioUrl }) => {
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>("1");
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = parseFloat(playbackSpeed);
    }
  }, [playbackSpeed]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Listen</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Speed:</span>
          <Select
            value={playbackSpeed}
            onValueChange={(value) => setPlaybackSpeed(value as PlaybackSpeed)}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="1x" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">0.5x</SelectItem>
              <SelectItem value="0.75">0.75x</SelectItem>
              <SelectItem value="1">1x</SelectItem>
              <SelectItem value="1.25">1.25x</SelectItem>
              <SelectItem value="1.5">1.5x</SelectItem>
              <SelectItem value="1.75">1.75x</SelectItem>
              <SelectItem value="2">2x</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <audio
          ref={audioRef}
          controls
          className="w-full"
          src={audioUrl}
        >
          Your browser does not support the audio element.
        </audio>
      </CardContent>
    </Card>
  );
};