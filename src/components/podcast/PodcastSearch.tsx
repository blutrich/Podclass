import { Search, Link } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PodcastSearchProps {
  searchType: "name" | "url";
  searchQuery: string;
  podcastUrl: string;
  setSearchType: (type: "name" | "url") => void;
  setSearchQuery: (query: string) => void;
  setPodcastUrl: (url: string) => void;
  handleSearch: () => void;
  isSearching: boolean;
}

export const PodcastSearch = ({
  searchType,
  searchQuery,
  podcastUrl,
  setSearchType,
  setSearchQuery,
  setPodcastUrl,
  handleSearch,
  isSearching,
}: PodcastSearchProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8">
      <div className="flex-1">
        <Tabs defaultValue={searchType} className="w-full" onValueChange={(value) => setSearchType(value as "name" | "url")}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="name">Search by Name</TabsTrigger>
            <TabsTrigger value="url">Search by URL</TabsTrigger>
          </TabsList>
          <TabsContent value="name" className="mt-0">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search podcasts by name..."
                className="pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </TabsContent>
          <TabsContent value="url" className="mt-0">
            <div className="relative">
              <Link className="absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Enter podcast URL..."
                className="pl-10 w-full"
                value={podcastUrl}
                onChange={(e) => setPodcastUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <div className="flex items-center">
        <Button onClick={handleSearch} disabled={isSearching} className="w-full md:w-auto">
          {isSearching ? "Searching..." : "Find Podcasts"}
        </Button>
      </div>
    </div>
  );
};