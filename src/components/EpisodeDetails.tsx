import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { EpisodeHeader } from "./episode/EpisodeHeader";
import { EpisodeActions } from "./episode/EpisodeActions";
import { EpisodeTranscript } from "./episode/EpisodeTranscript";
import { EpisodeAudioPlayer } from "./episode/EpisodeAudioPlayer";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { EpisodeLoadingSkeleton } from "./episode/EpisodeLoadingSkeleton";
import { EpisodeDescription } from "./episode/EpisodeDescription";
import { Card } from "./ui/card";
import { Calendar, Clock, Loader2, Lightbulb, Target, BookOpen, Sparkles, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { EpisodeDetailsCard } from "./episode/EpisodeDetailsCard";
import { TranscriptChat } from "./episode/TranscriptChat";
import { LessonContent } from "./LessonContent";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

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

export const EpisodeDetails = ({ episode }: { episode: Episode }) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const { toast: uiToast } = useToast();
  const queryClient = useQueryClient();
  const progressIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const pollIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const [showTranscript, setShowTranscript] = useState(false);
  const navigate = useNavigate();

  // Fetch episode data with automatic updates
  const { data: updatedEpisode } = useQuery({
    queryKey: ['episode', episode.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('episodes')
        .select('*, podcast:podcasts (*)')
        .eq('id', episode.id)
        .single();

      if (error) {
        console.error('Error fetching episode:', error);
        throw error;
      }

      return {
        ...data,
        podcast: data.podcast ? {
          id: data.podcast.id,
          name: data.podcast.name,
          description: data.podcast.description,
          image_url: data.podcast.image_url
        } : null
      } as Episode;
    },
    staleTime: 1000, // Update every second when needed
    refetchInterval: isTranscribing ? 1000 : false, // Poll while transcribing
  });

  // Lesson content query with persistence
  const { data: lessonContent, error: lessonError, isLoading: isLoadingLesson } = useQuery({
    queryKey: ['lesson', episode.id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: lesson, error } = await supabase
        .from("lessons")
        .select("lesson_content")
        .eq("episode_id", episode.id)
        .eq("user_id", user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return lesson?.lesson_content || null;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Mutation for updating lesson content
  const updateLessonMutation = useMutation({
    mutationFn: async (newLessonContent: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("lessons")
        .upsert({
          episode_id: episode.id,
          user_id: user.id,
          lesson_content: newLessonContent,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Update the cache with new lesson content
      queryClient.setQueryData(['lesson', episode.id], data.lesson_content);
      
      uiToast({
        title: "Success",
        description: "Lesson saved successfully",
      });
    },
    onError: (error) => {
      console.error("Error saving lesson:", error);
      uiToast({
        title: "Error",
        description: "Failed to save lesson. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTranscribe = async () => {
    try {
      setIsTranscribing(true);
      setTranscriptionProgress(0);
      
      if (!episode.audio_url) {
        throw new Error("No audio URL available for transcription");
      }

      // Start progress animation
      progressIntervalRef.current = setInterval(() => {
        setTranscriptionProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 2000);

      // Start transcription
      const { error: transcriptionError } = await supabase.functions.invoke(
        'transcribe-episode',
        {
          body: {
            audioUrl: episode.audio_url,
            episodeId: episode.id,
          }
        }
      );

      if (transcriptionError) throw transcriptionError;

      // Poll for completion
      pollIntervalRef.current = setInterval(async () => {
        const { data, error } = await supabase
          .from('episodes')
          .select('transcript')
          .eq('id', episode.id)
          .single();
        
        if (error) {
          console.error('Error checking transcription status:', error);
          return;
        }
        
        if (data?.transcript) {
          // Clear intervals
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          
          // Update progress and state
          setTranscriptionProgress(100);
          setIsTranscribing(false);
          
          // Update cache
          await queryClient.invalidateQueries({ queryKey: ['episode', episode.id] });
          
          // Show success message
          uiToast({
            title: "Success",
            description: "Episode transcribed successfully",
          });
        }
      }, 5000);

    } catch (error) {
      console.error("Error in transcription process:", error);
      setIsTranscribing(false);
      setTranscriptionProgress(0);
      
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      
      uiToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to transcribe episode. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateLesson = async () => {
    try {
      if (!updatedEpisode?.transcript) {
        toast.error("Please transcribe the episode first");
        return;
      }

      setIsGeneratingLesson(true);
      toast.info("Starting lesson generation...");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to generate lessons");
        return;
      }

      console.log('Starting lesson generation with transcript length:', updatedEpisode.transcript.length);

      const { data: generatedLesson, error: generationError } = await supabase.functions.invoke(
        'generate-lesson',
        {
          body: {
            episodeId: updatedEpisode.id,
            transcript: updatedEpisode.transcript,
            promptType: 'summary',
          }
        }
      );

      if (generationError) {
        console.error('Generation error:', generationError);
        throw generationError;
      }

      console.log('Raw generated lesson:', generatedLesson);

      if (!generatedLesson?.content) {
        throw new Error("Failed to generate lesson content");
      }

      // Parse the content if it's a string (OpenAI response)
      let parsedContent;
      try {
        parsedContent = typeof generatedLesson.content === 'string' 
          ? JSON.parse(generatedLesson.content)
          : generatedLesson.content;
      } catch (parseError) {
        console.error('Error parsing lesson content:', parseError);
        throw new Error("Failed to parse lesson content");
      }

      console.log('Parsed lesson content:', parsedContent);

      // Transform and validate the content
      const transformedContent = {
        title: parsedContent.title?.text || parsedContent.title || "Untitled Lesson",
        summary: typeof parsedContent.summary === 'string' 
          ? parsedContent.summary 
          : parsedContent.summary?.paragraphs?.join('\n\n') || "",
        top_takeaways: Array.isArray(parsedContent.takeaways?.items) 
          ? parsedContent.takeaways.items.map(item => item.text)
          : Array.isArray(parsedContent.top_takeaways)
          ? parsedContent.top_takeaways
          : [],
        core_concepts: Array.isArray(parsedContent.coreConcepts)
          ? parsedContent.coreConcepts.map(concept => ({
              name: concept.name,
              what_it_is: concept.definition || concept.what_it_is,
              quote: concept.quote,
              how_to_apply: Array.isArray(concept.applications) 
                ? concept.applications 
                : concept.how_to_apply || []
            }))
          : Array.isArray(parsedContent.core_concepts)
          ? parsedContent.core_concepts
          : [],
        practical_examples: Array.isArray(parsedContent.practicalExamples)
          ? parsedContent.practicalExamples.map(example => ({
              context: example.context,
              quote: example.quote,
              lesson: example.lesson
            }))
          : Array.isArray(parsedContent.practical_examples)
          ? parsedContent.practical_examples
          : [],
        action_steps: Array.isArray(parsedContent.actionSteps)
          ? parsedContent.actionSteps.map(step => step.text)
          : Array.isArray(parsedContent.action_steps)
          ? parsedContent.action_steps
          : []
      };

      console.log('Transformed lesson content:', transformedContent);

      // Validate the transformed content
      if (!transformedContent.title || !transformedContent.summary) {
        throw new Error("Generated lesson is missing required content");
      }

      // Save the lesson
      const { error: saveError } = await supabase
        .from("lessons")
        .insert({
          user_id: user.id,
          episode_id: updatedEpisode.id,
          lesson_content: transformedContent,
          format_type: 'summary',
          status: 'completed'
        });

      if (saveError) {
        console.error('Save error:', saveError);
        throw saveError;
      }

      toast.success("Lesson generated successfully!");
      await queryClient.invalidateQueries({ queryKey: ['lesson', episode.id] });

    } catch (error: any) {
      console.error('Lesson generation error:', error);
      toast.error(error.message || "Failed to generate lesson");
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const displayEpisode = updatedEpisode || episode;

  const handleBackToPodcast = () => {
    if (episode.podcast?.id) {
      navigate(`/podcast/${episode.podcast.id}`);
    } else {
      navigate('/app');  // Fallback to main app page if no podcast ID
    }
  };

  if (lessonError) {
    toast("Failed to load lesson content", {
      description: "Please try refreshing the page",
    });
  }

  if (isLoadingLesson) {
    return <EpisodeLoadingSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={handleBackToPodcast}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Podcast</span>
        </Button>
      </div>

      {/* Episode Details */}
      <EpisodeDetailsCard episode={displayEpisode} />

      {/* Audio Player */}
      {displayEpisode.audio_url && (
        <div className={cn(
          "border-2 border-black dark:border-white rounded-lg p-6",
          isTranscribing && "opacity-50 transition-opacity duration-300"
        )}>
          <h2 className="text-xl font-bold mb-4">Listen to Episode</h2>
          <EpisodeAudioPlayer audioUrl={displayEpisode.audio_url} />
        </div>
      )}

      {/* Lesson Content */}
      {lessonContent && (
        <div className="border-2 border-black dark:border-white rounded-lg">
          <LessonContent content={lessonContent} />
        </div>
      )}

      {/* Transcript Display */}
      {displayEpisode.transcript && !isTranscribing && (
        <div className="border-2 border-black dark:border-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Transcript</h2>
            <button 
              onClick={() => setShowTranscript(!showTranscript)}
              className="px-4 py-2 border-2 border-black dark:border-white rounded-lg hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            >
              {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
            </button>
          </div>
          {showTranscript && (
            <div className="mt-4 prose prose-lg dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {displayEpisode.transcript}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chat Interface */}
      {updatedEpisode?.transcript && (
        <TranscriptChat 
          transcript={updatedEpisode.transcript} 
          episodeId={updatedEpisode.id}
        />
      )}
    </div>
  );
};