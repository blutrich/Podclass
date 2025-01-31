import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Lightbulb, Target, BookOpen, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UniversitySection } from "./UniversitySection";
import { TranscriptionSteps } from "./episode/TranscriptionSteps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import React from "react";

interface LessonContent {
  key_takeaways: string[];
  action_steps: string[];
  reflection_questions: string[];
  industry_insights?: string[];
}

interface Lesson {
  id: string;
  lesson_content: LessonContent;
  status: string;
  format_type?: string;
  industry_insights?: string[];
  difficulty_level?: string;
}

interface Episode {
  id: string;
  name: string;
  transcript?: string;
  audio_url?: string;
}

const LessonSection = ({ 
  title, 
  items, 
  icon: Icon,
  className 
}: { 
  title: string; 
  items: string[]; 
  icon: React.ElementType;
  className?: string;
}) => {
  if (!items?.length) return null;

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className="rounded-full bg-background p-2.5 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={index} className="flex gap-3 text-muted-foreground">
              <span className="select-none font-semibold text-foreground">•</span>
              <span className="flex-1">{item.replace(/^\*\*|\*\*$/g, '')}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export const LessonView = ({ episode }: { episode: Episode }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [formatType, setFormatType] = useState<string>("summary");
  const queryClient = useQueryClient();

  // Initialize format type
  React.useEffect(() => {
    if (!formatType) {
      setFormatType("summary");
    }
  }, [formatType]);

  const handleFormatChange = (format: string) => {
    console.log('Format changed to:', format);
    setFormatType(format);
  };

  const { data: existingLesson, isLoading: isLoadingLesson } = useQuery({
    queryKey: ['lesson', episode.id],
    queryFn: async () => {
      console.log('Fetching lesson for episode:', episode.id);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        return null;
      }

      try {
        const { data: lessons, error } = await supabase
          .from("lessons")
          .select("*")
          .eq("episode_id", episode.id)
          .eq("user_id", user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error("Error fetching lesson:", error);
          throw error;
        }

        console.log('Fetched lessons:', lessons);
        return lessons && lessons.length > 0 ? lessons[0] : null;
      } catch (error) {
        console.error("Error in lesson query:", error);
        throw error;
      }
    },
    enabled: !!episode.id,
  });

  const handleTranscribe = async (): Promise<void> => {
    if (!episode.audio_url) {
      toast.error("No audio URL available for transcription");
      return;
    }

    let pollInterval: number;

    try {
      setIsTranscribing(true);
      setTranscriptionProgress(0);
      toast.info("Starting transcription...");
      
      const { data: transcriptionResult, error: transcribeError } = await supabase.functions.invoke(
        'transcribe-episode',
        {
          body: { 
            episodeId: episode.id, 
            audioUrl: episode.audio_url 
          }
        }
      );

      if (transcribeError) throw transcribeError;

      // Poll for transcription status
      pollInterval = window.setInterval(async () => {
        const { data: updatedEpisode } = await supabase
          .from('episodes')
          .select('transcript')
          .eq('id', episode.id)
          .single();
        
        if (updatedEpisode?.transcript) {
          clearInterval(pollInterval);
          setTranscriptionProgress(100);
          toast.success("Transcription complete!");
          window.location.reload();
        } else {
          setTranscriptionProgress((prev) => Math.min(prev + 10, 90));
        }
      }, 5000);

    } catch (error: any) {
      console.error("Error in transcription:", error);
      toast.error("Failed to transcribe episode. Please try again.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const generateLesson = async () => {
    try {
      // Early validation and logging
      console.log('Starting lesson generation...', {
        episodeId: episode.id,
        hasTranscript: !!episode.transcript,
        transcriptLength: episode.transcript?.length,
        formatType
      });

      if (!episode.transcript) {
        toast.error("Please transcribe the episode first");
        return;
      }

      if (!formatType) {
        console.log('No format selected, using default');
        setFormatType('summary');
        return;
      }

      // Set loading state immediately
      setIsGenerating(true);
      toast.info(`Starting ${formatType} generation...`);
      
      // Auth check
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to generate lessons");
        setIsGenerating(false);
        return;
      }

      console.log('Calling generate-lesson edge function...', {
        userId: user.id,
        transcriptLength: episode.transcript.length,
        format: formatType,
      });

      // Call edge function with timeout handling
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      );

      const generatePromise = supabase.functions.invoke(
        'generate-lesson',
        {
          body: {
            episodeId: episode.id,
            transcript: episode.transcript,
            promptType: formatType,
          }
        }
      );

      const { data: generatedLessonData, error: generationError } = await Promise.race([
        generatePromise,
        timeoutPromise
      ]) as any;

      console.log('Edge function response:', {
        success: !generationError,
        error: generationError,
        data: generatedLessonData,
      });

      if (generationError) {
        console.error('Generation error details:', {
          message: generationError.message,
          details: generationError.details,
          hint: generationError.hint,
          code: generationError.code
        });
        throw generationError;
      }

      if (!generatedLessonData?.content) {
        console.error('Invalid lesson content:', generatedLessonData);
        throw new Error("Invalid lesson content received. The AI service may be temporarily unavailable.");
      }

      console.log('Saving lesson to database...');

      const { error: saveError } = await supabase
        .from("lessons")
        .insert({
          user_id: user.id,
          episode_id: episode.id,
          lesson_content: generatedLessonData.content,
          format_type: formatType,
          status: 'completed',
          industry_insights: generatedLessonData.industryInsights || [],
          difficulty_level: 'intermediate'
        });

      if (saveError) {
        console.error('Error saving lesson:', {
          error: saveError,
          details: saveError.details,
          hint: saveError.hint,
          code: saveError.code
        });
        throw saveError;
      }

      console.log('Lesson saved successfully, invalidating queries...');

      await queryClient.invalidateQueries({ queryKey: ['lesson', episode.id] });
      await queryClient.invalidateQueries({ queryKey: ['lessons'] });

      toast.success(`${formatType} lesson generated successfully!`);

    } catch (error: any) {
      console.error("Error in lesson generation:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        details: error.details,
        code: error.code
      });
      
      // More specific error messages
      if (error.message?.includes('timeout')) {
        toast.error("Generation is taking longer than expected. Please try again.");
      } else if (error.message?.includes('OpenAI')) {
        toast.error("AI service error. Please try again in a few moments.");
      } else if (error.code === 'PGRST301') {
        toast.error("Database error. Please try again.");
      } else if (error.code === 401 || error.code === 403) {
        toast.error("Authentication error. Please sign in again.");
      } else {
        toast.error(error.message || "Failed to generate lesson. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoadingLesson) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (existingLesson) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <LessonSection
            title="Key Takeaways"
            items={existingLesson.lesson_content?.key_takeaways}
            icon={Lightbulb}
            className="bg-blue-50/50 dark:bg-blue-950/20"
          />
          {existingLesson.industry_insights && (
            <LessonSection
              title="Industry Insights"
              items={existingLesson.industry_insights}
              icon={Sparkles}
              className="bg-purple-50/50 dark:bg-purple-950/20"
            />
          )}
          <LessonSection
            title="Action Steps"
            items={existingLesson.lesson_content?.action_steps}
            icon={Target}
            className="bg-green-50/50 dark:bg-green-950/20"
          />
          <LessonSection
            title="Reflection Questions"
            items={existingLesson.lesson_content?.reflection_questions}
            icon={BookOpen}
            className="bg-amber-50/50 dark:bg-amber-950/20"
          />
        </div>
        <UniversitySection lessonId={existingLesson.id} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 space-y-4">
      <TranscriptionSteps
        hasTranscript={!!episode.transcript}
        isTranscribing={isTranscribing}
        isGeneratingLesson={isGenerating}
        transcriptionProgress={transcriptionProgress}
        selectedFormat={formatType}
        onFormatChange={handleFormatChange}
        onTranscribe={handleTranscribe}
        onGenerateLesson={generateLesson}
      />
    </div>
  );
};