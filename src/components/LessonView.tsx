import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Lightbulb, Target, BookOpen, Sparkles, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UniversitySection } from "./UniversitySection";
import { TranscriptionSteps } from "./episode/TranscriptionSteps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import React from "react";
import { EnhancedLessonDisplay } from "./lesson/EnhancedLessonDisplay";

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

const FallbackImage = () => (
  <div className="flex items-center justify-center w-full h-full min-h-[100px] bg-muted rounded-lg">
    <ImageOff className="h-8 w-8 text-muted-foreground" />
  </div>
);

const SafeImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <FallbackImage />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
    />
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

  const handleTranscribe = async () => {
    if (!episode.audio_url) {
      toast.error("No audio URL available for transcription");
      return;
    }

    let pollInterval: NodeJS.Timeout;

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
      pollInterval = setInterval(async () => {
        try {
          const { data: updatedEpisode, error } = await supabase
            .from('episodes')
            .select('transcript')
            .eq('id', episode.id)
            .single();
          
          if (error) {
            console.error('Error checking transcription status:', error);
            return;
          }
          
          if (updatedEpisode?.transcript) {
            clearInterval(pollInterval);
            setTranscriptionProgress(100);
            toast.success("Transcription complete!");
            
            // Update the cache and state
            await queryClient.invalidateQueries({ queryKey: ['episode', episode.id] });
            setIsTranscribing(false);
          } else {
            setTranscriptionProgress((prev) => Math.min(prev + 10, 90));
          }
        } catch (pollError) {
          console.error('Error in transcription polling:', pollError);
          clearInterval(pollInterval);
          setIsTranscribing(false);
          toast.error("Error checking transcription status");
        }
      }, 5000);

    } catch (error: any) {
      console.error("Error in transcription:", error);
      toast.error(error.message || "Failed to transcribe episode");
      if (pollInterval) clearInterval(pollInterval);
      setIsTranscribing(false);
    }

    // Cleanup function
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  };

  const generateLesson = async () => {
    try {
      if (!episode?.transcript) {
        toast.error("Please transcribe the episode first");
        return;
      }

      setIsGenerating(true);
      toast.info("Starting lesson generation...");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to generate lessons");
        return;
      }

      console.log('Starting lesson generation with transcript:', {
        transcriptLength: episode.transcript.length,
        episodeId: episode.id,
        userId: user.id
      });

      // Split long transcripts into chunks if needed
      const maxChunkSize = 25000;
      let transcript = episode.transcript;
      if (transcript.length > maxChunkSize) {
        transcript = transcript.slice(0, maxChunkSize);
        console.log('Transcript truncated to first chunk:', transcript.length);
      }

      // Create timeout promise
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Lesson generation timed out after 3 minutes. Please try again with a shorter transcript.')), 180000);
      });

      console.log('Calling generate-lesson function...');
      // Make the API call with timeout
      const generatePromise = supabase.functions.invoke(
        'generate-lesson',
        {
          body: {
            episodeId: episode.id,
            transcript,
            promptType: 'summary'
          }
        }
      );

      let result;
      try {
        console.log('Awaiting generate-lesson response...');
        result = await Promise.race([generatePromise, timeout]) as any;
        console.log('Received generate-lesson response:', result);
      } catch (raceError: any) {
        console.error('Error in race condition:', raceError);
        if (raceError.message?.includes('timed out')) {
          throw new Error('The lesson generation took too long. Please try with a shorter transcript.');
        }
        throw raceError;
      }

      const { data: generatedLesson, error: generationError } = result;
      console.log('Parsed response:', { data: generatedLesson, error: generationError });

      if (generationError) {
        console.error('Generation error:', generationError);
        throw new Error(generationError.message || 'Failed to generate lesson');
      }

      // Log the full response for debugging
      console.log('Generated lesson response:', generatedLesson);

      if (!generatedLesson?.data) {
        console.error('No response received');
        throw new Error("No response received from lesson generation");
      }

      // Extract the lesson content from the response
      const lessonContent = generatedLesson.data;
      console.log('Extracted lesson content:', lessonContent);

      // Log the content structure for debugging
      console.log('Content validation check:', {
        hasTitle: !!lessonContent?.title,
        hasSummary: !!lessonContent?.summary,
        hasKeyTakeaways: Array.isArray(lessonContent?.key_takeaways),
        hasCoreConcepts: Array.isArray(lessonContent?.core_concepts),
        hasPracticalExamples: Array.isArray(lessonContent?.practical_examples),
        hasActionSteps: Array.isArray(lessonContent?.action_steps)
      });

      // Validate the content structure
      if (!lessonContent || typeof lessonContent.title !== 'string' || typeof lessonContent.summary !== 'string') {
        console.error('Invalid lesson content structure:', {
          lessonContent,
          validationError: {
            hasContent: !!lessonContent,
            titleType: typeof lessonContent?.title,
            summaryType: typeof lessonContent?.summary
          }
        });
        throw new Error("Invalid or empty lesson content received");
      }

      // Transform the content to match our database structure
      const transformedContent = {
        title: lessonContent.title,
        summary: lessonContent.summary,
        key_takeaways: Array.isArray(lessonContent.key_takeaways) ? lessonContent.key_takeaways : [],
        core_concepts: Array.isArray(lessonContent.core_concepts) ? lessonContent.core_concepts : [],
        practical_examples: Array.isArray(lessonContent.practical_examples) ? lessonContent.practical_examples : [],
        action_steps: Array.isArray(lessonContent.action_steps) ? lessonContent.action_steps : []
      };

      console.log('Transformed content:', transformedContent);

      // Save the lesson
      const { error: saveError } = await supabase
        .from("lessons")
        .insert({
          user_id: user.id,
          episode_id: episode.id,
          lesson_content: transformedContent,
          format_type: 'summary',
          status: 'completed'
        });

      if (saveError) {
        console.error('Error saving lesson:', saveError);
        throw saveError;
      }

      toast.success("Lesson generated and saved successfully!");
      
      // Refresh the lessons list
      await queryClient.invalidateQueries({ queryKey: ['lessons'] });
      await queryClient.invalidateQueries({ queryKey: ['lesson', episode.id] });

    } catch (error: any) {
      console.error("Error in lesson generation:", error);
      toast.error(error.message || "Failed to generate lesson");
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
    // Transform the lesson data to match the EnhancedLessonDisplay format
    const transformedLesson = {
      title: {
        text: existingLesson.lesson_content?.title || "Untitled Lesson"
      },
      summary: {
        paragraphs: existingLesson.lesson_content?.summary 
          ? [existingLesson.lesson_content.summary]
          : []
      },
      takeaways: {
        items: (existingLesson.lesson_content?.key_takeaways || []).map((text, index) => ({
          id: index + 1,
          text
        }))
      },
      coreConcepts: (existingLesson.lesson_content?.core_concepts || []).map((concept, index) => ({
        id: index + 1,
        name: concept.name,
        definition: concept.what_it_is,
        quote: concept.quote,
        applications: concept.how_to_apply || []
      })),
      practicalExamples: (existingLesson.lesson_content?.practical_examples || []).map((example, index) => ({
        id: index + 1,
        context: example.context,
        quote: example.quote,
        lesson: example.lesson
      })),
      actionSteps: (existingLesson.lesson_content?.action_steps || []).map((text, index) => ({
        id: index + 1,
        text
      }))
    };

    return (
      <div className="space-y-6">
        <EnhancedLessonDisplay lesson={transformedLesson} />
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