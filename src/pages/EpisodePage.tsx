import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EpisodeDetails } from "@/components/EpisodeDetails";
import { LessonView } from "@/components/LessonView";
import { useQuery } from "@tanstack/react-query";

interface PodcastData {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

interface EpisodeData {
  id: string;
  name: string;
  audio_url: string | null;
  description: string | null;
  transcript: string | null;
  podcast: PodcastData | null;
}

export function EpisodePage() {
  const { episodeId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: episode, isLoading, error } = useQuery({
    queryKey: ['episode', episodeId],
    queryFn: async () => {
      console.log('Fetching episode:', episodeId);
      
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Authentication error');
      }
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to view episodes",
          variant: "destructive",
        });
        navigate('/login');
        return null;
      }

      try {
        const { data: episodeData, error: fetchError } = await supabase
          .from("episodes")
          .select(`
            id,
            name,
            audio_url,
            description,
            transcript,
            podcast:podcasts (
              id,
              name,
              description,
              image_url
            )
          `)
          .eq("id", episodeId)
          .maybeSingle();

        if (fetchError) {
          console.error('Supabase fetch error:', fetchError);
          throw fetchError;
        }

        if (!episodeData) {
          console.log('No episode found with ID:', episodeId);
          throw new Error("Episode not found");
        }

        const transformedEpisode: EpisodeData = {
          id: episodeData.id,
          name: episodeData.name,
          audio_url: episodeData.audio_url,
          description: episodeData.description,
          transcript: episodeData.transcript,
          podcast: episodeData.podcast ? {
            id: episodeData.podcast.id,
            name: episodeData.podcast.name,
            description: episodeData.podcast.description,
            image_url: episodeData.podcast.image_url
          } : null
        };

        console.log('Transformed episode data:', transformedEpisode);
        return transformedEpisode;
      } catch (error) {
        console.error('Error fetching episode:', error);
        throw error;
      }
    },
    retry: 5,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading episode...</p>
        </div>
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background p-4">
        <Alert variant="destructive" className="max-w-md w-full mb-4">
          <AlertDescription>
            {error?.message === "Episode not found"
              ? "The requested episode could not be found. It may have been deleted or you may have followed an invalid link."
              : "There was an error loading the episode. Please try again later."}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => navigate('/app')}
          className="inline-flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Podcast
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-4xl">
        <div className="space-y-4 sm:space-y-8">
          <EpisodeDetails episode={episode} />
          <LessonView episode={episode} />
        </div>
      </div>
    </div>
  );
}