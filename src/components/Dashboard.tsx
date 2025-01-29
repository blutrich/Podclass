import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LessonsSection } from "./LessonsSection";
import { StatsCards } from "./dashboard/StatsCards";
import { SearchSection } from "./dashboard/SearchSection";
import { SearchResults } from "./dashboard/SearchResults";

export const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: folders = [], isLoading: isLoadingFolders } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to view folders",
          variant: "destructive",
        });
        return [];
      }

      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching folders:", error);
        throw error;
      }
      return data;
    },
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        navigate('/');
        toast({
          title: "Authentication required",
          description: "Please sign in to access the dashboard",
          variant: "destructive",
        });
      }
    };
    
    checkAuth();
  }, [navigate, toast]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a podcast name to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to search podcasts",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      const { data, error } = await supabase.functions.invoke('search-podcasts', {
        body: { searchQuery: searchQuery.trim() },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data?.data?.getPodcastSeries) {
        const podcast = data.data.getPodcastSeries;
        const { error: dbError } = await supabase
          .from('podcasts')
          .upsert({
            id: podcast.uuid,
            name: podcast.name,
            description: podcast.description,
            image_url: podcast.imageUrl,
          });

        if (dbError) throw dbError;

        const episodesData = podcast.episodes.map(episode => ({
          id: episode.uuid,
          podcast_id: podcast.uuid,
          name: episode.name,
          audio_url: episode.audioUrl,
        }));

        const { error: episodesError } = await supabase
          .from('episodes')
          .upsert(episodesData);

        if (episodesError) throw episodesError;

        setSearchResults([podcast]);
        toast({
          title: "Search successful",
          description: "Found matching podcasts",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: error.message || "Failed to search podcasts",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-primary text-white p-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">PodClass</h1>
          <p className="mt-2">Ideas Worth Doing</p>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <SearchSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
          isSearching={isSearching}
        />

        <StatsCards
          folders={folders}
          isLoadingFolders={isLoadingFolders}
        />

        <div className="mb-8">
          <LessonsSection />
        </div>

        <SearchResults searchResults={searchResults} />
      </main>
    </div>
  );
};