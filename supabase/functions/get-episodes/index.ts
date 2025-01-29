import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

interface Episode {
  id: number;
  title: string;
  description: string;
  datePublished: number;
  enclosureUrl: string;
  duration: number;
  episode: number;
  episodeType: string;
  explicit: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { podcastId } = await req.json()
    
    if (!podcastId) {
      throw new Error('Podcast ID is required')
    }

    const apiKey = Deno.env.get('PODCAST_INDEX_API_KEY')
    const apiSecret = Deno.env.get('PODCAST_INDEX_API_SECRET')

    if (!apiKey || !apiSecret) {
      throw new Error('Missing Podcast Index API credentials')
    }

    // Generate the required authorization headers
    const unixTime = Math.floor(Date.now() / 1000);
    const authString = apiKey + apiSecret + unixTime;
    
    // Create SHA-1 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(authString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Fetching episodes for podcast ID:', podcastId);

    const response = await fetch(
      `https://api.podcastindex.org/api/1.0/episodes/byfeedid?id=${podcastId}&max=50`,
      {
        headers: {
          'X-Auth-Date': unixTime.toString(),
          'X-Auth-Key': apiKey,
          'Authorization': hash,
          'User-Agent': 'PodLearn/1.0',
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Podcast Index API error:', response.status, errorText);
      throw new Error(`Failed to fetch episodes: ${response.status}`);
    }

    const result = await response.json();
    console.log('Podcast Index API response received');

    if (!result.items) {
      console.log('No episodes found');
      return new Response(
        JSON.stringify({ episodes: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const episodes = result.items.map((episode: Episode) => ({
      id: episode.id.toString(),
      title: episode.title,
      description: episode.description,
      audioUrl: episode.enclosureUrl,
      duration: episode.duration ? `${Math.floor(episode.duration / 60)}:${(episode.duration % 60).toString().padStart(2, '0')}` : undefined,
      publishedAt: episode.datePublished ? new Date(episode.datePublished * 1000).toISOString() : undefined,
    }));

    console.log(`Found ${episodes.length} episodes`);
    
    return new Response(
      JSON.stringify({ episodes }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
})