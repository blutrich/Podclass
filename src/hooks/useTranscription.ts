import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseTranscriptionProps {
  episodeId: string;
  audioUrl: string | null;
}

export function useTranscription({ episodeId, audioUrl }: UseTranscriptionProps) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const queryClient = useQueryClient();
  const progressIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const pollIntervalRef = useRef<ReturnType<typeof setInterval>>();

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const startTranscription = async () => {
    try {
      if (!audioUrl) {
        throw new Error("No audio URL available for transcription");
      }

      setIsTranscribing(true);
      setTranscriptionProgress(0);
      toast.info("Starting transcription...");

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
            audioUrl,
            episodeId,
          }
        }
      );

      if (transcriptionError) throw transcriptionError;

      // Poll for completion
      pollIntervalRef.current = setInterval(async () => {
        const { data, error } = await supabase
          .from('episodes')
          .select('transcript')
          .eq('id', episodeId)
          .single();
        
        if (error) {
          console.error('Error checking transcription status:', error);
          return;
        }
        
        if (data?.transcript) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          setTranscriptionProgress(100);
          
          // Invalidate and refetch queries
          await queryClient.invalidateQueries({ queryKey: ['episode', episodeId] });
          await queryClient.invalidateQueries({ queryKey: ['transcript', episodeId] });
          
          toast.success("Episode transcribed successfully");
          setIsTranscribing(false);
        }
      }, 5000);

    } catch (error) {
      handleTranscriptionError(error);
    }
  };

  const handleTranscriptionError = (error: unknown) => {
    console.error("Error in transcription process:", error);
    setIsTranscribing(false);
    setTranscriptionProgress(0);
    
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Failed to transcribe episode. Please try again.";
    
    toast.error(errorMessage);
  };

  return {
    isTranscribing,
    transcriptionProgress,
    startTranscription
  };
} 