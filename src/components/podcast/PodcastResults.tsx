import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Podcast {
  uuid: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

interface PodcastResultsProps {
  searchResults: Podcast[];
  onPodcastClick: (podcast: Podcast) => void;
}

export const PodcastResults = ({ searchResults, onPodcastClick }: PodcastResultsProps) => {
  if (searchResults.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Search Results</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {searchResults.map((podcast) => (
          <Card key={podcast.uuid} className="overflow-hidden hover:shadow-lg transition-shadow">
            {podcast.imageUrl && (
              <div className="h-48 bg-gray-200">
                <img
                  src={podcast.imageUrl}
                  alt={podcast.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold mb-2">{podcast.name}</h3>
              <p className="text-gray-600 text-sm line-clamp-3">
                {podcast.description}
              </p>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => onPodcastClick(podcast)}
                >
                  Preview
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};