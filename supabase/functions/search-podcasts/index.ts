import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
}

function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch (err) {
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    console.log('Received request:', req.method);
    const { searchQuery, podcastUrl, filters = {} } = await req.json();
    console.log('Search request:', { searchQuery, podcastUrl, filters });

    const apiKey = Deno.env.get('PODCAST_INDEX_API_KEY');
    const apiSecret = Deno.env.get('PODCAST_INDEX_API_SECRET');
    
    if (!apiKey || !apiSecret) {
      console.error('Missing API credentials');
      return new Response(
        JSON.stringify({
          error: 'API credentials not configured',
          data: { searchResults: [] }
        }),
        { 
          headers: corsHeaders,
          status: 200
        }
      );
    }

    // Validate input
    if (!searchQuery && !podcastUrl) {
      return new Response(
        JSON.stringify({
          error: 'Missing search parameters',
          details: 'Either searchQuery or podcastUrl must be provided',
          data: { searchResults: [] }
        }),
        { 
          headers: corsHeaders,
          status: 200
        }
      );
    }

    // Additional URL validation for podcast URL searches
    if (podcastUrl && !isValidUrl(podcastUrl)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid podcast URL format',
          details: 'Please provide a valid URL starting with http:// or https://',
          data: { searchResults: [] }
        }),
        { 
          headers: corsHeaders,
          status: 200
        }
      );
    }

    const unixTime = Math.floor(Date.now() / 1000);
    const authString = apiKey + apiSecret + unixTime;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(authString);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    let apiEndpoint;
    let searchParams;

    if (podcastUrl) {
      apiEndpoint = 'https://api.podcastindex.org/api/1.0/podcasts/byfeedurl';
      searchParams = new URLSearchParams({
        url: podcastUrl,
        pretty: '1'
      });
    } else {
      // If a category is specified but no search query, use the byCategory endpoint
      if (filters.category && !searchQuery) {
        apiEndpoint = 'https://api.podcastindex.org/api/1.0/podcasts/bytag';
        searchParams = new URLSearchParams({
          tag: filters.category,
          pretty: '1',
          ...(filters.language && { lang: filters.language }),
          ...(filters.page && { page: filters.page.toString() }),
        });
      } else {
        // Use combined search with category if both are specified
        apiEndpoint = 'https://api.podcastindex.org/api/1.0/search/byterm';
        searchParams = new URLSearchParams({
          q: filters.category ? `${searchQuery} ${filters.category}` : searchQuery,
          pretty: '1',
          similar: '1',
          fulltext: '1',
          ...(filters.language && { lang: filters.language }),
          ...(filters.page && { page: filters.page.toString() }),
        });
      }
    }

    console.log('Making request to:', `${apiEndpoint}?${searchParams}`);

    const apiResponse = await fetch(
      `${apiEndpoint}?${searchParams}`,
      {
        headers: {
          'X-Auth-Date': unixTime.toString(),
          'X-Auth-Key': apiKey,
          'Authorization': hash,
          'User-Agent': 'PodLearn/1.0',
        }
      }
    );

    console.log('API Response status:', apiResponse.status);
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('Podcast Index API error:', apiResponse.status, errorText);
      
      // Handle specific error cases
      if (apiResponse.status === 400) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid podcast feed or search query',
            details: podcastUrl 
              ? 'The provided URL is not a valid podcast RSS feed. Please check the URL and try again.'
              : 'Invalid search query. Please try a different search term.',
            data: { searchResults: [] }
          }),
          { 
            headers: corsHeaders,
            status: 200
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Search service unavailable',
          details: 'The podcast search service is currently unavailable. Please try again later.',
          data: { searchResults: [] }
        }),
        { 
          headers: corsHeaders,
          status: 200
        }
      );
    }

    const result = await apiResponse.json();
    console.log('API response received:', result);

    if (!result) {
      return new Response(
        JSON.stringify({ 
          error: 'Empty response',
          details: 'No results found',
          data: { searchResults: [] }
        }),
        { 
          headers: corsHeaders,
          status: 200
        }
      );
    }

    let searchResults;
    if (podcastUrl) {
      if (!result.feed) {
        return new Response(
          JSON.stringify({ 
            data: { 
              searchResults: [],
              count: 0,
              query: podcastUrl
            }
          }),
          { headers: corsHeaders }
        );
      }
      searchResults = [{
        uuid: result.feed.id.toString(),
        name: result.feed.title,
        description: result.feed.description,
        imageUrl: result.feed.artwork || result.feed.image,
        rssUrl: result.feed.url,
        language: result.feed.language,
        genres: result.feed.categories ? Object.values(result.feed.categories) : [],
        author: result.feed.author,
        episodeCount: result.feed.episodeCount,
      }];
    } else {
      if (!result.feeds) {
        return new Response(
          JSON.stringify({ 
            data: { 
              searchResults: [],
              count: 0,
              query: searchQuery
            }
          }),
          { headers: corsHeaders }
        );
      }

      searchResults = result.feeds.map((podcast: any) => ({
        uuid: podcast.id.toString(),
        name: podcast.title,
        description: podcast.description,
        imageUrl: podcast.artwork || podcast.image,
        rssUrl: podcast.url,
        language: podcast.language,
        genres: podcast.categories ? Object.values(podcast.categories) : [],
        author: podcast.author,
        episodeCount: podcast.episodeCount,
      }));
    }

    return new Response(
      JSON.stringify({ 
        data: { 
          searchResults,
          count: searchResults.length,
          query: podcastUrl || searchQuery,
        }
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: 'An unexpected error occurred while searching for podcasts',
        data: { searchResults: [] }
      }),
      { 
        headers: corsHeaders,
        status: 200
      }
    );
  }
});