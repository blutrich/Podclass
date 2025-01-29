import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface CreateEpisodeFormProps {
  podcastId: string;
  onSuccess?: () => void;
}

export function CreateEpisodeForm({ podcastId, onSuccess }: CreateEpisodeFormProps) {
  const [name, setName] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create the episode
      const { data: episode, error } = await supabase
        .from("episodes")
        .insert([
          {
            name,
            audio_url: audioUrl,
            podcast_id: podcastId,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Start transcription process
      const { data: transcriptionResult, error: transcriptionError } = await supabase.functions.invoke(
        'transcribe-episode',
        {
          body: {
            audioUrl,
            episodeId: episode.id,
          }
        }
      );

      if (transcriptionError) {
        console.error('Transcription error:', transcriptionError);
        toast({
          title: "Warning",
          description: "Episode created but transcription failed to start. You can try again later.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Episode created and transcription started",
        });
      }

      if (episode) {
        navigate(`/episode/${episode.id}`);
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error creating episode:", error);
      toast({
        title: "Error",
        description: "Failed to create episode",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Episode Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Enter episode name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="audioUrl">Audio URL</Label>
        <Input
          id="audioUrl"
          value={audioUrl}
          onChange={(e) => setAudioUrl(e.target.value)}
          required
          placeholder="Enter audio URL"
          type="url"
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating..." : "Create Episode"}
      </Button>
    </form>
  );
}