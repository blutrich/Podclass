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
import { Calendar, Clock, Loader2, Lightbulb, Target, BookOpen, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { EpisodeDetailsCard } from "./episode/EpisodeDetailsCard";
import { TranscriptChat } from "./episode/TranscriptChat";

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

const LessonContent = ({ content }: { content: any }) => {
  if (!content) return null;

  const cleanContent = (text: string | undefined | null) => {
    if (!text) return '';
    return text
      .replace(/^\*\*|\*\*$/g, '')
      .replace(/^##\s*|####\s*/g, '')
      .replace(/^[•-]\s*/, '')
      .replace(/^--$/, '')
      .trim();
  };

  const filterValidItems = (items: any[] | undefined) => {
    if (!items) return [];
    return items.filter(item => 
      item && 
      typeof item === 'string' && 
      !item.match(/^(####|\*\*|--)$/) && 
      item.trim().length > 0
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-16 py-8">
      {/* Title */}
      <div className="border-b-4 border-black dark:border-white pb-6">
        <h1 className="text-4xl font-extrabold tracking-tight">
          {cleanContent(content.title) || 'Untitled Lesson'}
        </h1>
      </div>

      {/* Summary */}
      {content.summary && (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">SUMMARY</h2>
          <div className="prose prose-lg dark:prose-invert">
            <p>{cleanContent(content.summary)}</p>
          </div>
        </div>
      )}

      {/* Top 3 Takeaways */}
      {content.top_takeaways?.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">TOP 3 TAKEAWAYS</h2>
          <ol className="list-decimal pl-6 space-y-6">
            {filterValidItems(content.top_takeaways).map((takeaway: string, index: number) => (
              <li key={index} className="text-xl leading-relaxed pl-2">
                {cleanContent(takeaway)}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Core Concepts */}
      {content.core_concepts?.length > 0 && (
        <div className="space-y-12">
          <h2 className="text-3xl font-bold tracking-tight">CORE CONCEPTS</h2>
          <div className="divide-y-2 divide-black dark:divide-white">
            {content.core_concepts.map((concept: any, index: number) => (
              <div key={index} className="py-8 first:pt-0 last:pb-0">
                <h3 className="text-2xl font-bold mb-6">
                  {cleanContent(concept.name)}
                </h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-3">Definition</h4>
                    <p className="text-xl leading-relaxed">
                      {cleanContent(concept.what_it_is)}
                    </p>
                  </div>
                  {concept.quote && (
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Quote</h4>
                      <blockquote className="text-xl italic border-l-4 border-black dark:border-white pl-6 py-1">
                        "{cleanContent(concept.quote)}"
                      </blockquote>
                    </div>
                  )}
                  {concept.how_to_apply?.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Application</h4>
                      <ul className="space-y-4">
                        {filterValidItems(concept.how_to_apply).map((point: string, i: number) => (
                          <li key={i} className="text-xl leading-relaxed flex items-start">
                            <span className="mr-4">-</span>
                            <span>{cleanContent(point)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Practical Examples */}
      {content.practical_examples?.length > 0 && (
        <div className="space-y-12">
          <h2 className="text-3xl font-bold tracking-tight">PRACTICAL EXAMPLES</h2>
          <div className="divide-y-2 divide-black dark:divide-white">
            {content.practical_examples.map((example: any, index: number) => (
              <div key={index} className="py-8 first:pt-0 last:pb-0">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-3">Context</h4>
                    <p className="text-xl leading-relaxed">
                      {cleanContent(example.context)}
                    </p>
                  </div>
                  {example.quote && (
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Quote</h4>
                      <blockquote className="text-xl italic border-l-4 border-black dark:border-white pl-6 py-1">
                        "{cleanContent(example.quote)}"
                      </blockquote>
                    </div>
                  )}
                  {example.lesson && (
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Insight</h4>
                      <p className="text-xl leading-relaxed">
                        {cleanContent(example.lesson)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Steps */}
      {content.action_steps?.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">ACTION STEPS</h2>
          <ol className="list-decimal pl-6 space-y-6">
            {filterValidItems(content.action_steps).map((step: string, index: number) => (
              <li key={index} className="text-xl leading-relaxed pl-2">
                {cleanContent(step)}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export const EpisodeDetails = ({ episode }: { episode: Episode }) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const { toast: uiToast } = useToast();
  const queryClient = useQueryClient();
  const progressIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const pollIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const [showTranscript, setShowTranscript] = useState(false);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Fetch updated episode data with caching
  const { data: updatedEpisode, refetch: refetchEpisode } = useQuery({
    queryKey: ['episode', episode.id],
    queryFn: async () => {
      console.log('Fetching updated episode data');
      const { data, error } = await supabase
        .from('episodes')
        .select('*, podcast:podcasts (*)')
        .eq('id', episode.id)
        .single();

      if (error) {
        console.error('Error fetching episode:', error);
        throw error;
      }

      // Transform the data to match Episode type
      const transformedData: Episode = {
        id: data.id,
        name: data.name,
        audio_url: data.audio_url,
        transcript: data.transcript,
        description: data.description,
        published_at: data.published_at,
        duration: data.duration,
        podcast: data.podcast ? {
          id: data.podcast.id,
          name: data.podcast.name,
          description: data.podcast.description,
          image_url: data.podcast.image_url
        } : null
      };

      return transformedData;
    },
    enabled: false,
    staleTime: 300000, // 5 minutes
    gcTime: 1800000, // 30 minutes
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

  // Check transcription status
  const checkTranscriptionStatus = async () => {
    console.log('Checking transcription status for episode:', episode.id);
    try {
      const { data, error } = await supabase
        .from('episodes')
        .select('transcript')
        .eq('id', episode.id)
        .single();
      
      if (error) {
        console.error('Error checking transcription status:', error);
        return false;
      }
      
      const hasTranscript = !!data?.transcript;
      console.log('Transcription status:', hasTranscript ? 'Complete' : 'In Progress');
      return hasTranscript;
    } catch (error) {
      console.error('Error in checkTranscriptionStatus:', error);
      return false;
    }
  };

  const handleTranscribe = async () => {
    try {
      console.log('Starting transcription for episode:', episode.id);
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
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes maximum (with 5-second intervals)
      
      pollIntervalRef.current = setInterval(async () => {
        attempts++;
        console.log(`Checking transcription status (attempt ${attempts}/${maxAttempts})`);
        
        const isComplete = await checkTranscriptionStatus();
        
        if (isComplete) {
          console.log('Transcription completed successfully');
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          setTranscriptionProgress(100);
          
          await refetchEpisode();
          
          // Invalidate and refetch lesson content
          await queryClient.invalidateQueries({
            queryKey: ['lesson', episode.id]
          });
          
          uiToast({
            title: "Success",
            description: "Episode transcribed successfully",
          });
          
          setIsTranscribing(false);
        } else if (attempts >= maxAttempts) {
          throw new Error("Transcription is taking longer than expected");
        }
      }, 5000);

    } catch (error: any) {
      console.error("Error in transcription process:", error);
      setIsTranscribing(false);
      setTranscriptionProgress(0);
      
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      
      uiToast({
        title: "Error",
        description: error.message || "Failed to transcribe episode. Please try again.",
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

      if (!generatedLesson?.content) {
        throw new Error("Failed to generate lesson content");
      }

      console.log('Raw generated lesson content:', generatedLesson.content);

      // Transform the content to match our new structure
      const transformedContent = {
        title: generatedLesson.content.title || "Untitled Lesson",
        summary: generatedLesson.content.summary || "",
        top_takeaways: Array.isArray(generatedLesson.content.top_takeaways) 
          ? generatedLesson.content.top_takeaways 
          : generatedLesson.content.key_takeaways || [],
        core_concepts: Array.isArray(generatedLesson.content.core_concepts) 
          ? generatedLesson.content.core_concepts.map(concept => ({
              name: concept.name || '',
              what_it_is: concept.what_it_is || concept.definition || '',
              quote: concept.quote || '',
              how_to_apply: Array.isArray(concept.how_to_apply) 
                ? concept.how_to_apply 
                : concept.application || []
            }))
          : [],
        practical_examples: Array.isArray(generatedLesson.content.practical_examples)
          ? generatedLesson.content.practical_examples.map(example => ({
              context: example.context || '',
              quote: example.quote || '',
              lesson: example.lesson || example.insight || ''
            }))
          : [],
        action_steps: Array.isArray(generatedLesson.content.action_steps)
          ? generatedLesson.content.action_steps
          : []
      };

      console.log('Transformed lesson content:', transformedContent);

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

  const displayEpisode = updatedEpisode || episode;

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
        <div className="border-2 border-black dark:border-white rounded-lg p-6">
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

      {/* Chat Interface - Only show if transcript exists */}
      {displayEpisode.transcript && !isTranscribing && (
        <div className="border-2 border-black dark:border-white rounded-lg p-6">
          <TranscriptChat transcript={displayEpisode.transcript} />
        </div>
      )}
    </div>
  );
};