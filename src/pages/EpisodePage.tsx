import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EpisodeDetails } from "@/components/episode/EpisodeDetails";
import { LessonView } from "@/components/LessonView";
import { supabase } from "@/integrations/supabase/client";

export function EpisodePage() {
  const navigate = useNavigate();
  const { episodeId } = useParams();

  const { data: episode, isLoading, error } = useQuery({
    queryKey: ["episode", episodeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select(`
          *,
          podcast:podcasts (
            id,
            name,
            description,
            image_url,
            author,
            category
          )
        `)
        .eq("id", episodeId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Episode not found");
      return data;
    },
    retry: 5,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-background px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading episode...</p>
        </div>
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-background p-4">
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
          Back to Podcasts
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/app')}
          className="mb-4 -ml-2 hover:bg-transparent hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="whitespace-nowrap">Back to Podcasts</span>
        </Button>
        
        <div className="space-y-4 w-full">
          <EpisodeDetails episode={episode} />
          <LessonView episode={episode} />
        </div>
      </div>
    </div>
  );
}