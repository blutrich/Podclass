import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AudioWaveform, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Episode {
  id: string;
  name: string;
  audio_url: string | null;
  transcript: string | null;
  description: string | null;
  published_at?: string;
  duration?: string;
  podcast: {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
  } | null;
}

const LESSON_FORMATS = {
  summary: "Quick Summary",
  technical: "Technical Deep Dive",
  beginner: "Beginner Friendly",
  expert: "Expert Analysis",
  actionable: "Actionable Steps",
  discussion: "Discussion Guide",
  key_points: "Key Points",
  study_guide: "Study Guide"
};

interface TranscriptionStepsProps {
  hasTranscript: boolean;
  isTranscribing: boolean;
  isGeneratingLesson: boolean;
  transcriptionProgress: number;
  onTranscribe: () => void;
  onGenerateLesson: () => void;
  selectedFormat?: string;
  onFormatChange?: (format: string) => void;
  episode?: Episode;
}

export function TranscriptionSteps({
  hasTranscript,
  isTranscribing,
  isGeneratingLesson,
  transcriptionProgress,
  onTranscribe,
  onGenerateLesson,
  selectedFormat,
  onFormatChange,
  episode
}: TranscriptionStepsProps) {
  const handleGenerateClick = () => {
    console.log('Generate button clicked', {
      hasTranscript,
      isGeneratingLesson
    });

    if (!hasTranscript) {
      console.log('Cannot generate lesson: No transcript available');
      return;
    }

    if (isGeneratingLesson) {
      console.log('Already generating lesson');
      return;
    }

    console.log('Calling onGenerateLesson');
    onGenerateLesson();
  };

  return (
    <div className="w-full space-y-6">
      {/* Progress Line */}
      <div className="relative h-0.5 bg-muted-foreground/20">
        <div
          className="absolute left-0 h-full bg-primary transition-all duration-500"
          style={{
            width: hasTranscript ? "100%" : isTranscribing ? `${transcriptionProgress}%` : "0%",
          }}
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          variant={hasTranscript ? "secondary" : "default"}
          onClick={onTranscribe}
          disabled={isTranscribing || hasTranscript}
          className="w-full"
        >
          {isTranscribing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Transcribing...
            </>
          ) : hasTranscript ? (
            <>
              <AudioWaveform className="mr-2 h-4 w-4" />
              Transcribed
            </>
          ) : (
            <>
              <AudioWaveform className="mr-2 h-4 w-4" />
              1. Transcribe Episode
            </>
          )}
        </Button>

        <Button
          variant="default"
          onClick={handleGenerateClick}
          disabled={!hasTranscript || isGeneratingLesson}
          className="w-full"
        >
          {isGeneratingLesson ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Generating Structured Lesson...</span>
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              <span>2. Generate Lesson</span>
            </>
          )}
        </Button>
      </div>

      {/* Status Messages */}
      {isTranscribing && (
        <p className="text-sm text-muted-foreground text-center">
          Transcribing episode... This may take a few minutes depending on the length.
        </p>
      )}
      {isGeneratingLesson && (
        <p className="text-sm text-muted-foreground text-center">
          Creating a structured lesson from the transcript...
          <br />
          <span className="text-xs">
            We're using AI to analyze the content and create a comprehensive lesson plan.
          </span>
        </p>
      )}
    </div>
  );
} 