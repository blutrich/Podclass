import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PodcastSearch } from "./podcast/PodcastSearch";
import { AudioPlayer } from "./podcast/AudioPlayer";
import { PodcastPreview } from "./PodcastPreview";
import { Card } from "./ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { PodcastResults } from "./podcast/PodcastResults";
import { SelectedEpisodeView } from "./podcast/SelectedEpisodeView";

interface Podcast {
  title: string;
  author: string;
  image: string;
  id: string;
  description?: string;
  taddyTranscribeStatus?: boolean;
  rssUrl?: string;
  language?: string;
  genres?: string[];
}

interface Episode {
  id: string;
  title: string;
  audioUrl: string;
  duration?: string;
  publishedAt?: string;
}

interface SearchState {
  searchQuery: string;
  podcastUrl: string;
  searchType: "name" | "url";
  searchResults: any[];
  selectedPodcast: Podcast | null;
}

const STORAGE_KEYS = {
  SEARCH_QUERY: 'podclass_search_query',
  PODCAST_URL: 'podclass_podcast_url',
  SEARCH_TYPE: 'podclass_search_type',
  SEARCH_RESULTS: 'podclass_search_results',
  SELECTED_PODCAST: 'podclass_selected_podcast',
  NAVIGATION_HISTORY: 'podclass_navigation_history'
} as const;

export function MainContent() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  const initialSearchState: SearchState = {
    searchQuery: localStorage.getItem(STORAGE_KEYS.SEARCH_QUERY) || '',
    podcastUrl: localStorage.getItem(STORAGE_KEYS.PODCAST_URL) || '',
    searchType: (localStorage.getItem(STORAGE_KEYS.SEARCH_TYPE) as "name" | "url") || "name",
    searchResults: JSON.parse(localStorage.getItem(STORAGE_KEYS.SEARCH_RESULTS) || '[]'),
    selectedPodcast: JSON.parse(localStorage.getItem(STORAGE_KEYS.SELECTED_PODCAST) || 'null'),
  };

  // Use React Query for state management with proper typing
  const { data: searchState } = useQuery<SearchState>({
    queryKey: ['searchState'],
    queryFn: () => initialSearchState,
    staleTime: Infinity,
  });

  const [searchQuery, setSearchQuery] = useState(searchState?.searchQuery || initialSearchState.searchQuery);
  const [podcastUrl, setPodcastUrl] = useState(searchState?.podcastUrl || initialSearchState.podcastUrl);
  const [searchType, setSearchType] = useState<"name" | "url">(searchState?.searchType || initialSearchState.searchType);
  const [searchResults, setSearchResults] = useState<any[]>(searchState?.searchResults || initialSearchState.searchResults);
  const [previewPodcast, setPreviewPodcast] = useState<Podcast | null>(searchState?.selectedPodcast || initialSearchState.selectedPodcast);
  const [selectedEpisode, setSelectedEpisode] = useState<{
    id: string;
    name: string;
    transcript?: string;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const { data: episodes, isLoading: isLoadingEpisodes } = useQuery({
    queryKey: ['episodes', previewPodcast?.id],
    queryFn: async () => {
      if (!previewPodcast?.id) return [];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to view episodes",
          variant: "destructive",
        });
        navigate('/login');
        return [];
      }

      const { data, error } = await supabase.functions.invoke('get-episodes', {
        body: { podcastId: previewPodcast.id },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Error fetching episodes:', error);
        toast({
          title: "Failed to load episodes",
          description: error.message || "Could not load podcast episodes",
          variant: "destructive",
        });
        return [];
      }

      return data?.episodes || [];
    },
    enabled: !!previewPodcast?.id,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        navigate('/login');
        toast({
          title: "Authentication required",
          description: "Please sign in to continue",
          variant: "destructive",
        });
      }
    };

    checkAuth();
  }, [navigate, toast]);

  // Save state to localStorage and React Query cache
  const saveState = () => {
    const currentState = {
      searchQuery,
      podcastUrl,
      searchType,
      searchResults,
      selectedPodcast: previewPodcast,
    };

    // Update localStorage
    Object.entries(currentState).forEach(([key, value]) => {
      localStorage.setItem(
        STORAGE_KEYS[key.toUpperCase() as keyof typeof STORAGE_KEYS],
        typeof value === 'object' ? JSON.stringify(value) : value
      );
    });

    // Update React Query cache
    queryClient.setQueryData(['searchState'], currentState);
  };

  // Save state when component updates
  useEffect(() => {
    saveState();
  }, [searchQuery, podcastUrl, searchType, searchResults, previewPodcast]);

  // Save navigation history
  useEffect(() => {
    const history = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.NAVIGATION_HISTORY) || '[]'
    );
    
    if (location.pathname !== history[history.length - 1]) {
      history.push(location.pathname);
      localStorage.setItem(STORAGE_KEYS.NAVIGATION_HISTORY, JSON.stringify(history));
    }
  }, [location]);

  // Handle back navigation
  useEffect(() => {
    const handlePopState = () => {
      const state = queryClient.getQueryData(['searchState']);
      if (state) {
        setSearchQuery(state.searchQuery);
        setPodcastUrl(state.podcastUrl);
        setSearchType(state.searchType);
        setSearchResults(state.searchResults);
        setPreviewPodcast(state.selectedPodcast);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [queryClient]);

  const handlePodcastClick = async (podcast: any) => {
    const newPreviewPodcast = {
      id: podcast.uuid,
      title: podcast.name,
      author: podcast.author || "",
      image: podcast.imageUrl,
      description: podcast.description,
      taddyTranscribeStatus: podcast.taddyTranscribeStatus,
      rssUrl: podcast.rssUrl,
      language: podcast.language,
      genres: podcast.genres,
    };
    
    setPreviewPodcast(newPreviewPodcast);
    saveState(); // Save state after selecting a podcast
  };

  const handlePlayEpisode = (audioUrl: string) => {
    if (currentAudioUrl === audioUrl) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentAudioUrl(audioUrl);
      setIsPlaying(true);
    }
  };

  const handleSelectPodcast = () => {
    if (previewPodcast) {
      setSelectedEpisode({
        id: previewPodcast.id,
        name: previewPodcast.title,
      });
      setPreviewPodcast(null);
    }
  };

  const handleSearch = async () => {
    const query = searchType === "name" ? searchQuery : podcastUrl;
    if (!query.trim()) {
      toast({
        title: `${searchType === "name" ? "Search query" : "URL"} required`,
        description: `Please enter a podcast ${searchType === "name" ? "name" : "URL"} to search`,
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
        navigate('/login');
        return;
      }

      const { data, error } = await supabase.functions.invoke('search-podcasts', {
        body: { 
          searchQuery: searchType === "name" ? query.trim() : "",
          podcastUrl: searchType === "url" ? query.trim() : "",
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data?.data?.searchResults) {
        setSearchResults(data.data.searchResults);
        saveState(); // Save state after successful search
        toast({
          title: "Search successful",
          description: `Found ${data.data.searchResults.length} matching podcasts`,
        });
      } else {
        toast({
          title: "No results found",
          description: "Try adjusting your search terms or filters",
        });
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: error.message || "Failed to search podcasts",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className={`flex flex-col gap-4 mb-6 md:mb-8 ${isMobile ? 'mt-12' : ''}`}>
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">Listen & Learn</h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-[42rem]">
            Select a podcast to generate an AI-powered lesson
          </p>
        </div>
      </div>

      <PodcastSearch
        searchType={searchType}
        searchQuery={searchQuery}
        podcastUrl={podcastUrl}
        setSearchType={setSearchType}
        setSearchQuery={setSearchQuery}
        setPodcastUrl={setPodcastUrl}
        handleSearch={handleSearch}
        isSearching={isSearching}
      />

      {selectedEpisode ? (
        <SelectedEpisodeView
          episode={selectedEpisode}
          currentAudioUrl={currentAudioUrl}
          isPlaying={isPlaying}
          onBack={() => setSelectedEpisode(null)}
          setIsPlaying={setIsPlaying}
        />
      ) : (
        <>
          {searchResults.length > 0 && (
            <PodcastResults
              searchResults={searchResults}
              onPodcastClick={handlePodcastClick}
            />
          )}
        </>
      )}

      {previewPodcast && (
        <PodcastPreview
          podcast={previewPodcast}
          isOpen={!!previewPodcast}
          onClose={() => setPreviewPodcast(null)}
          onSelect={handleSelectPodcast}
          episodes={episodes}
          isLoadingEpisodes={isLoadingEpisodes}
          onPlayEpisode={handlePlayEpisode}
          currentlyPlaying={{
            isPlaying,
            audioUrl: currentAudioUrl
          }}
        />
      )}
    </main>
  );
}