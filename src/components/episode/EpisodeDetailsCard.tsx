import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Mic2, Radio, Tag, Volume2, Link as LinkIcon, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Episode {
  id: string;
  name: string;
  audio_url: string | null;
  transcript: string | null;
  description: string | null;
  published_at?: string;
  duration?: string;
  episode_type?: string;
  season_number?: number;
  episode_number?: number;
  explicit?: boolean;
  podcast: {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    author?: string;
    category?: string;
  } | null;
}

interface EpisodeDetailsCardProps {
  episode: Episode;
  className?: string;
}

function extractSocialLinks(description: string) {
  const links = {
    linkedin: description.match(/LinkedIn\s*\|\s*([^\s|]+)/i)?.[1],
    instagram: description.match(/Instagram\s*\|\s*([^\s|]+)/i)?.[1],
    facebook: description.match(/Facebook\s*\|\s*([^\s|]+)/i)?.[1],
    youtube: description.match(/YouTube\s*\|\s*([^\s|]+)/i)?.[1],
    website: description.match(/Click here\.\s*([^\s]+)/i)?.[1],
  };

  return Object.entries(links).reduce((acc, [key, value]) => {
    if (value) acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
}

function cleanDescription(description: string): string {
  return description
    .replace(/Want to scale your business\? Click here\./g, '')
    .replace(/Follow.*Socials:.*$/s, '')
    .replace(/LinkedIn\s*\|.*$/s, '')
    .trim();
}

export function EpisodeDetailsCard({ episode, className }: EpisodeDetailsCardProps) {
  const socialLinks = episode.description ? extractSocialLinks(episode.description) : {};
  const hasSocialLinks = Object.keys(socialLinks).length > 0;
  const cleanedDescription = episode.description ? cleanDescription(episode.description) : null;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="border-b bg-muted/50 pb-4">
        <div className="flex items-start gap-4">
          {episode.podcast?.image_url && (
            <img
              src={episode.podcast.image_url}
              alt={episode.podcast.name || "Podcast cover"}
              className="h-24 w-24 rounded-lg object-cover shadow-md"
            />
          )}
          <div className="flex-1 space-y-1">
            <CardTitle className="text-xl font-bold leading-tight">
              {episode.name}
            </CardTitle>
            {episode.podcast?.name && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Radio className="h-4 w-4" />
                <span>{episode.podcast.name}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 p-6">
        {/* Episode Metadata */}
        <div className="flex flex-wrap gap-4 text-sm">
          {episode.published_at && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(episode.published_at), 'MMMM d, yyyy')}</span>
            </div>
          )}
          {episode.duration && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{episode.duration}</span>
            </div>
          )}
          {episode.podcast?.author && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mic2 className="h-4 w-4" />
              <span>{episode.podcast.author}</span>
            </div>
          )}
          {episode.podcast?.category && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Tag className="h-4 w-4" />
              <span>{episode.podcast.category}</span>
            </div>
          )}
          {episode.episode_type && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Volume2 className="h-4 w-4" />
              <span className="capitalize">{episode.episode_type}</span>
            </div>
          )}
        </div>

        {/* Episode Numbers */}
        {(episode.season_number || episode.episode_number || episode.explicit) && (
          <div className="flex gap-3 text-sm">
            {episode.season_number && (
              <div className="rounded-md bg-primary/10 px-2.5 py-1 font-medium">
                Season {episode.season_number}
              </div>
            )}
            {episode.episode_number && (
              <div className="rounded-md bg-primary/10 px-2.5 py-1 font-medium">
                Episode {episode.episode_number}
              </div>
            )}
            {episode.explicit && (
              <div className="rounded-md bg-red-500/10 px-2.5 py-1 font-medium text-red-600">
                Explicit
              </div>
            )}
          </div>
        )}

        {/* Episode Description */}
        {cleanedDescription && (
          <div className="space-y-2">
            <h3 className="font-medium">Episode Description</h3>
            <div className="prose prose-sm max-w-none text-muted-foreground">
              <div dangerouslySetInnerHTML={{ __html: cleanedDescription }} />
            </div>
          </div>
        )}

        {/* Podcast Info */}
        {(episode.podcast?.description || hasSocialLinks) && (
          <Collapsible className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">About the Podcast</h3>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <span className="sr-only">Toggle podcast info</span>
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent className="space-y-4">
              {episode.podcast?.description && (
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    <div dangerouslySetInnerHTML={{ __html: episode.podcast.description }} />
                  </div>
                </div>
              )}

              {/* Social Links */}
              {hasSocialLinks && (
                <div className="flex flex-wrap gap-2">
                  {socialLinks.linkedin && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {socialLinks.instagram && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Instagram
                      </a>
                    </Button>
                  )}
                  {socialLinks.facebook && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Facebook
                      </a>
                    </Button>
                  )}
                  {socialLinks.youtube && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        YouTube
                      </a>
                    </Button>
                  )}
                  {socialLinks.website && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={socialLinks.website} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Website
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
} 