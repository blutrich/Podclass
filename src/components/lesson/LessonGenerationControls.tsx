import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2, FileText, CheckCircle2, Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

interface Episode {
  id: string;
  audio_url?: string;
  transcript?: string;
}

interface LessonGenerationControlsProps {
  hasTranscript: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
  episode: Episode;
}

export const LessonGenerationControls = ({ 
  hasTranscript, 
  isGenerating,
  onGenerate,
  episode 
}: LessonGenerationControlsProps) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const queryClient = useQueryClient();
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const handleTranscribe = async () => {
    if (!episode.audio_url) {
      toast.error("No audio URL available for transcription");
      return;
    }

    try {
      setIsTranscribing(true);
      setTranscriptionProgress(0);
      toast.info("Starting transcription...");
      console.log('Starting transcription for episode:', episode.id);

      const { data: transcriptionResult, error: transcribeError } = await supabase.functions.invoke(
        'transcribe-episode',
        {
          body: { 
            episodeId: episode.id, 
            audioUrl: episode.audio_url 
          }
        }
      );

      if (transcribeError) {
        console.error('Transcription error:', transcribeError);
        throw transcribeError;
      }

      // Start polling for completion
      const pollInterval = setInterval(async () => {
        const { data: updatedEpisode, error: fetchError } = await supabase
          .from('episodes')
          .select('transcript')
          .eq('id', episode.id)
          .maybeSingle();

        if (fetchError) {
          console.error('Error checking transcript status:', fetchError);
          return;
        }

        if (updatedEpisode?.transcript) {
          clearInterval(pollInterval);
          setTranscriptionProgress(100);
          toast.success("Transcription complete!");
          
          // Invalidate and refetch queries with correct syntax
          await queryClient.invalidateQueries({ queryKey: ['episode', episode.id] });
          await queryClient.invalidateQueries({ queryKey: ['transcript', episode.id] });
          
          setIsTranscribing(false);
        } else {
          setTranscriptionProgress((prev) => Math.min(prev + 5, 90));
        }
      }, 5000);

      // Cleanup interval on component unmount
      return () => clearInterval(pollInterval);

    } catch (error: any) {
      console.error("Error in transcription:", error);
      toast.error(error.message || "Failed to transcribe episode");
      setIsTranscribing(false);
      setTranscriptionProgress(0);
    }
  };

  const handleGenerateLesson = async () => {
    if (!episode.transcript) {
      toast.error("No transcript available. Please transcribe the episode first.");
      return;
    }

    try {
      setIsGeneratingLesson(true);
      console.log('Starting lesson generation...', {
        episodeId: episode.id,
        transcriptLength: episode.transcript.length,
      });

      // First, validate the transcript
      if (episode.transcript.length < 100) {
        throw new Error('Transcript is too short to generate a meaningful lesson');
      }

      const { data: generatedLesson, error: generateError } = await supabase.functions.invoke(
        'generate-lesson',
        {
          body: {
            episodeId: episode.id,
            transcript: episode.transcript,
            promptType: 'summary'
          }
        }
      );

      if (generateError) {
        console.error('Lesson generation error:', {
          error: generateError,
          errorMessage: generateError.message,
          errorDetails: generateError.details,
          statusCode: generateError.status,
        });
        throw generateError;
      }

      if (!generatedLesson) {
        throw new Error('No lesson content received from the server');
      }

      console.log('Lesson generation completed:', {
        lessonData: generatedLesson,
        status: 'success'
      });
      
      toast.success("Lesson generated successfully!");
      onGenerate();
      
    } catch (error: any) {
      console.error("Error in lesson generation:", {
        error,
        message: error.message,
        stack: error.stack,
        type: error.constructor.name
      });
      
      // More specific error messages based on the error type
      if (error.message?.includes('OpenAI')) {
        toast.error("AI service error. Please try again in a few moments.");
      } else if (error.status === 400) {
        toast.error("Invalid request. Please check the transcript and try again.");
      } else if (error.status === 401 || error.status === 403) {
        toast.error("Authentication error. Please log in again.");
      } else {
        toast.error(error.message || "Failed to generate lesson");
      }
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  const handleCopyTranscript = async () => {
    if (episode.transcript) {
      try {
        await navigator.clipboard.writeText(episode.transcript);
        setHasCopied(true);
        toast.success("Transcript copied to clipboard");
        setTimeout(() => setHasCopied(false), 2000);
      } catch (err) {
        toast.error("Failed to copy transcript");
      }
    }
  };

  return (
    <div className="relative space-y-0 pb-8">
      {/* Progress Line */}
      <div className="absolute left-[27px] top-10 h-full w-0.5 bg-gradient-to-b from-blue-500 to-purple-500 opacity-20" />

      {/* Step 1: Transcription */}
      <div className="relative space-y-4 pb-12">
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full border-2 transition-colors duration-300",
            hasTranscript 
              ? "border-green-500 bg-green-50" 
              : "border-blue-500 bg-blue-50"
          )}>
            <span className="text-xl font-bold text-gray-700">1</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Transcribe Episode</h3>
            <p className="text-sm text-gray-600">Convert audio to text for lesson creation</p>
          </div>
          {hasTranscript && (
            <CheckCircle2 className="h-6 w-6 text-green-500 animate-in fade-in duration-300" />
          )}
        </div>
        
        <div className="ml-16 space-y-4">
          <div className="flex items-start gap-4">
            <Button 
              onClick={handleTranscribe} 
              className={cn(
                "flex items-center gap-2 transition-all duration-300",
                hasTranscript && "bg-green-500 hover:bg-green-600"
              )}
              disabled={isTranscribing || hasTranscript}
              variant={hasTranscript ? "default" : "default"}
            >
              {isTranscribing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Transcribing...
                </>
              ) : hasTranscript ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Transcribed
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Start Transcription
                </>
              )}
            </Button>

            {hasTranscript && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="text-sm hover:bg-gray-100"
                >
                  {showTranscript ? "Hide Transcript" : "Show Transcript"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopyTranscript}
                  className="text-sm"
                  disabled={!episode.transcript}
                >
                  {hasCopied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Transcript
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Transcript Display */}
          {hasTranscript && showTranscript && (
            <Card className="mt-4 border-blue-100 bg-blue-50/50 shadow-sm transition-all duration-300 animate-in slide-in-from-top-4">
              <CardContent className="p-4">
                <div className="prose prose-sm max-h-60 overflow-y-auto rounded-md bg-white p-4 shadow-inner">
                  <p className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                    {episode.transcript}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Step 2: Generate Lesson */}
      <div className="relative space-y-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full border-2 transition-colors duration-300",
            !hasTranscript 
              ? "border-gray-300 bg-gray-50" 
              : "border-purple-500 bg-purple-50"
          )}>
            <span className="text-xl font-bold text-gray-700">2</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Generate Lesson</h3>
            <p className="text-sm text-gray-600">Create an educational lesson from the transcript</p>
          </div>
        </div>

        <div className="ml-16">
          <Button 
            onClick={handleGenerateLesson} 
            className={cn(
              "flex items-center gap-2 transition-all duration-300",
              !hasTranscript && "opacity-50"
            )}
            disabled={isGeneratingLesson || isGenerating || !hasTranscript}
          >
            {(isGeneratingLesson || isGenerating) ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Lesson...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Generate Lesson
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};