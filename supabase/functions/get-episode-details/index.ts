import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TaddyEpisodeDetails {
  uuid: string;
  name: string;
  description: string;
  imageUrl: string | null;
  datePublished: number;
  audioUrl: string;
  duration: number;
  episodeType: string;
  isExplicitContent: boolean;
  podcastSeries: {
    uuid: string;
    name: string;
  };
  transcript?: string[];
}

interface TaddyResponse {
  data: {
    getPodcastEpisode: TaddyEpisodeDetails;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const { episodeId } = await req.json();
    console.log('Received episode ID:', episodeId);

    if (!episodeId) {
      console.error('Missing episode ID');
      return new Response(
        JSON.stringify({
          error: 'Episode ID is required'
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const query = `
      query GetEpisodeDetails($uuid: ID!) {
        getPodcastEpisode(uuid: $uuid) {
          uuid
          name
          description
          imageUrl
          datePublished
          audioUrl
          duration
          episodeType
          isExplicitContent
          podcastSeries {
            uuid
            name
          }
          transcript
        }
      }
    `;

    const taddyApiKey = Deno.env.get('TADDY_API_KEY');
    const taddyUserId = Deno.env.get('TADDY_USER_ID');

    if (!taddyApiKey || !taddyUserId) {
      console.error('Missing Taddy API credentials');
      throw new Error('Missing Taddy API credentials');
    }

    console.log('Making request to Taddy API with episode ID:', episodeId);
    const response = await fetch('https://api.taddy.org', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': taddyApiKey,
        'X-USER-ID': taddyUserId,
      },
      body: JSON.stringify({
        query,
        variables: { uuid: episodeId },
      }),
    });

    const result = await response.json();
    console.log('Taddy API response status:', response.status);

    if (!response.ok) {
      console.error('Taddy API error:', result);
      throw new Error(`Taddy API error: ${JSON.stringify(result)}`);
    }

    if (result.errors) {
      console.error('Taddy API GraphQL errors:', result.errors);
      throw new Error(`Taddy API GraphQL error: ${JSON.stringify(result.errors)}`);
    }

    const episodeDetails = result.data?.getPodcastEpisode;
    if (!episodeDetails) {
      console.error('No episode details in response:', result);
      throw new Error('No episode details found in API response');
    }

    console.log('Successfully fetched episode details');

    return new Response(
      JSON.stringify(episodeDetails),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error in get-episode-details function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error instanceof Error ? error.stack : undefined
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
});