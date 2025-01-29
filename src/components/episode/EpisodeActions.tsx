import { Button } from "@/components/ui/button";
import { AudioWaveform, Share2, Copy, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Episode {
  name: string;
  audio_url: string | null;
  transcript: string | null;
  description: string | null;
  podcast?: {
    name: string;
  } | null;
}

interface LessonContent {
  key_takeaways: string[];
  action_steps: string[];
  reflection_questions: string[];
  industry_insights?: string[];
}

interface EpisodeActionsProps {
  episode: Episode;
  isTranscribing: boolean;
  onTranscribe: () => Promise<void>;
  lessonContent?: LessonContent | null;
  onLessonUpdate?: (newContent: any) => void;
  isGeneratingLesson?: boolean;
}

const LESSON_FORMATS = {
  summary: "Summary",
  detailed: "Detailed Analysis",
  technical: "Technical Deep Dive",
  beginner: "Beginner Friendly",
  expert: "Expert Level"
};

export const EpisodeActions = ({
  episode,
  isTranscribing,
  onTranscribe,
  lessonContent,
  onLessonUpdate,
  isGeneratingLesson = false
}: EpisodeActionsProps) => {
  const { toast } = useToast();

  const handleRegenerateLesson = async (format: string) => {
    if (!episode.transcript) {
      toast({
        title: "No transcript available",
        description: "Please transcribe the episode first",
        variant: "destructive",
      });
      return;
    }

    try {
      if (onLessonUpdate) {
        await onLessonUpdate({ promptType: format });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate lesson",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    const shareText = `Check out this lesson from ${episode.podcast?.name}: ${episode.name}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopy = async () => {
    if (!lessonContent) {
      toast({
        title: "No lesson content",
        description: "Generate a lesson first before copying",
        variant: "destructive",
      });
      return;
    }

    const formatSection = (title: string, items: string[]) => {
      return items.length > 0 ? `${title}\n${items.map(item => `• ${item.replace(/^\*\*|\*\*$/g, '')}`).join('\n')}\n\n` : '';
    };

    const lessonText = `
${formatSection('Key Takeaways', lessonContent.key_takeaways)}
${lessonContent.industry_insights ? formatSection('Industry Insights', lessonContent.industry_insights) : ''}
${formatSection('Action Steps', lessonContent.action_steps)}
${formatSection('Reflection Questions', lessonContent.reflection_questions)}
    `.trim();
    
    try {
      await navigator.clipboard.writeText(lessonText);
      toast({
        title: "Success",
        description: "Lesson content copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {episode.audio_url && !episode.transcript && (
        <Button
          variant="outline"
          onClick={onTranscribe}
          disabled={isTranscribing}
          className="flex items-center gap-2"
        >
          <AudioWaveform className="h-4 w-4" />
          {isTranscribing ? "Transcribing..." : "Transcribe Episode"}
        </Button>
      )}

      {episode.transcript && (
        <div className="flex items-center gap-2">
          <Select
            onValueChange={handleRegenerateLesson}
            disabled={isGeneratingLesson}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LESSON_FORMATS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => handleRegenerateLesson('summary')}
            disabled={isGeneratingLesson}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isGeneratingLesson && "animate-spin")} />
            {isGeneratingLesson ? "Generating..." : "Regenerate"}
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={handleShare}
          className="flex items-center"
          size="icon"
        >
          <Share2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          onClick={handleCopy}
          className="flex items-center gap-2"
          disabled={!lessonContent}
        >
          <Copy className="h-4 w-4" />
          Copy Lesson
        </Button>
      </div>
    </div>
  );
};