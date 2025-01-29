import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: () => void;
  isSearching: boolean;
}

export const SearchSection = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
  isSearching,
}: SearchSectionProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Search podcasts..."
            className="pl-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
      </div>
      <Button onClick={handleSearch} disabled={isSearching}>
        {isSearching ? "Searching..." : "Find Podcasts"}
      </Button>
    </div>
  );
};