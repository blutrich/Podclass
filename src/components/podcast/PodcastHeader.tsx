import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

interface PodcastHeaderProps {
  title: string;
  author: string;
  imageUrl: string;
  description?: string;
}

export const PodcastHeader = ({ title, author, imageUrl, description }: PodcastHeaderProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="space-y-3">
      <div className={`${isMobile ? 'w-24 h-24' : 'w-32 h-32'} overflow-hidden rounded-lg shrink-0`}>
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      {description && (
        <ScrollArea className={`${isMobile ? 'h-[60px]' : 'h-[80px]'}`}>
          <div 
            className="text-xs text-muted-foreground pr-4"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </ScrollArea>
      )}
    </div>
  );
};