import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Link as LinkIcon } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useNavigate } from 'react-router-dom'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Podcast {
  id: string
  name: string
  description: string | null
  image_url: string | null
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
  { value: 'he', label: 'Hebrew' }
]

const COUNTRIES = [
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Germany' },
  { value: 'it', label: 'Italy' },
  { value: 'es', label: 'Spain' },
  { value: 'jp', label: 'Japan' },
  { value: 'br', label: 'Brazil' },
]

const CATEGORIES = [
  { value: 'technology', label: 'Technology' },
  { value: 'business', label: 'Business' },
  { value: 'education', label: 'Education' },
  { value: 'health', label: 'Health & Fitness' },
  { value: 'science', label: 'Science' },
  { value: 'arts', label: 'Arts' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'news', label: 'News' },
  { value: 'society', label: 'Society & Culture' },
  { value: 'sports', label: 'Sports' },
];

export function SearchPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('')
  const [podcastUrl, setPodcastUrl] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isSearching, setIsSearching] = useState(false)
  const [podcasts, setPodcasts] = useState<Podcast[]>([])
  const { toast } = useToast()

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a podcast name to search",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to search podcasts",
          variant: "destructive",
        })
        navigate('/login')
        return
      }

      const filters = {
        exactMatch: false,
        safeMode: true,
        page: 1,
        language: selectedLanguage || undefined,
        country: selectedCountry || undefined,
        category: selectedCategory || undefined
      }

      const { data, error } = await supabase.functions.invoke('search-podcasts', {
        body: { 
          searchQuery: searchQuery.trim(),
          filters
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (error) throw error

      if (data?.data?.searchResults) {
        setPodcasts(data.data.searchResults)
        toast({
          title: "Search successful",
          description: `Found ${data.data.searchResults.length} matching podcasts`,
        })
      } else {
        toast({
          title: "No results found",
          description: "Try adjusting your search terms, language, or country filters",
        })
        setPodcasts([])
      }
    } catch (error) {
      console.error('Search error:', error)
      toast({
        title: "Search failed",
        description: error.message || "Failed to search podcasts",
        variant: "destructive",
      })
      setPodcasts([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleUrlSearch = async () => {
    if (!podcastUrl.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a podcast URL to search",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to search podcasts",
          variant: "destructive",
        })
        navigate('/login')
        return
      }

      const { data, error } = await supabase.functions.invoke('search-podcasts', {
        body: { 
          podcastUrl: podcastUrl.trim()
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (error) throw error

      if (data?.data?.searchResults) {
        setPodcasts(data.data.searchResults)
        toast({
          title: "Search successful",
          description: `Found podcast from URL`,
        })
      } else {
        toast({
          title: "No results found",
          description: "Could not find a podcast at the provided URL",
        })
        setPodcasts([])
      }
    } catch (error) {
      console.error('URL search error:', error)
      toast({
        title: "Search failed",
        description: error.message || "Failed to find podcast from URL",
        variant: "destructive",
      })
      setPodcasts([])
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Find Podcasts</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Search for podcasts by title, topic, or direct URL
        </p>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="search" className="text-sm sm:text-base">Search by Name/Topic</TabsTrigger>
          <TabsTrigger value="url" className="text-sm sm:text-base">Search by URL</TabsTrigger>
        </TabsList>
        
        <TabsContent value="search">
          <div className="flex flex-col gap-3">
            <div className="w-full">
              <Input
                placeholder="Search podcasts by name or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full text-base"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All topics</SelectItem>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All languages</SelectItem>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All countries</SelectItem>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                onClick={handleSearch} 
                disabled={isSearching} 
                className="w-full h-10"
              >
                <Search className="mr-2 h-4 w-4" />
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="url">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter podcast URL..."
                value={podcastUrl}
                onChange={(e) => setPodcastUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUrlSearch()}
                className="w-full"
              />
            </div>
            <Button 
              onClick={handleUrlSearch} 
              disabled={isSearching} 
              className="w-full sm:w-auto h-10"
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              {isSearching ? 'Searching...' : 'Search URL'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {podcasts.length > 0 ? (
          podcasts.map((podcast) => (
            <Card key={podcast.id} className="flex flex-col">
              <CardHeader>
                <div className="aspect-square relative mb-4 rounded-lg overflow-hidden">
                  <img
                    src={podcast.image_url || '/placeholder.svg'}
                    alt={`${podcast.name} cover`}
                    className="object-cover w-full h-full"
                    loading="lazy"
                  />
                </div>
                <CardTitle className="text-lg sm:text-xl line-clamp-2">{podcast.name}</CardTitle>
                <CardDescription className="line-clamp-3 text-sm">
                  {podcast.description || 'No description available'}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-4">
                <Button 
                  className="w-full"
                  onClick={() => navigate(`/podcast/${podcast.id}`)}
                >
                  View Episodes
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {searchQuery || podcastUrl ? 'No podcasts found' : 'Search for podcasts to get started'}
          </div>
        )}
      </div>
    </div>
  );
}