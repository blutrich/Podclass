import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    
    // Log headers safely (excluding sensitive values)
    const headers = Object.fromEntries(req.headers.entries());
    console.log('Request headers:', {
      ...headers,
      authorization: headers.authorization ? 'Bearer [REDACTED]' : undefined,
      apikey: headers.apikey ? '[REDACTED]' : undefined,
    });

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    const apiKey = req.headers.get('apikey');
    
    if (!authHeader || !apiKey) {
      console.error('Missing required headers:', {
        hasAuth: !!authHeader,
        hasApiKey: !!apiKey
      });
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          details: 'Missing required authentication headers'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const body = await req.json();
    console.log('Request body:', {
      ...body,
      audioUrl: body.audioUrl ? '[REDACTED URL]' : undefined,
    });
    
    const { audioUrl, episodeId } = body;
    if (!audioUrl || !episodeId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          details: 'audioUrl and episodeId are required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get AssemblyAI API key
    const assemblyAIKey = Deno.env.get('ASSEMBLYAI_API_KEY');
    if (!assemblyAIKey) {
      console.error('AssemblyAI API key not configured');
      return new Response(
        JSON.stringify({
          error: 'Configuration error',
          details: 'Transcription service not properly configured'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Log the API key length (safely)
    console.log('AssemblyAI API key length:', assemblyAIKey.length);
    console.log('AssemblyAI API key first 4 chars:', assemblyAIKey.substring(0, 4));

    // Initialize AssemblyAI transcription
    console.log('Initiating transcription with AssemblyAI');
    try {
      const response = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': assemblyAIKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          language_code: 'en',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AssemblyAI API error:', {
          status: response.status,
          error: errorText,
          headers: Object.fromEntries(response.headers.entries()),
        });
        return new Response(
          JSON.stringify({
            error: 'Transcription service error',
            details: `Failed to initiate transcription: ${errorText}`
          }),
          {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const transcriptionData = await response.json();
      console.log('Transcription initiated:', transcriptionData);

      // Poll for transcription completion
      const checkTranscription = async (transcriptId: string): Promise<string> => {
        console.log('Checking transcription status for:', transcriptId);
        const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          headers: {
            'Authorization': `Bearer ${assemblyAIKey}`,
          },
        });

        if (!statusResponse.ok) {
          const errorText = await statusResponse.text();
          console.error('AssemblyAI status check error:', errorText);
          throw new Error('Failed to check transcription status');
        }

        const result = await statusResponse.json();
        console.log('Transcription status:', result.status);

        if (result.status === 'completed') {
          return result.text;
        } else if (result.status === 'error') {
          throw new Error(`Transcription failed: ${result.error}`);
        }

        // Wait 3 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 3000));
        return checkTranscription(transcriptId);
      };

      const transcript = await checkTranscription(transcriptionData.id);
      console.log('Transcription completed successfully');

      // Update episode with transcript
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (!supabaseUrl || !supabaseKey) {
        return new Response(
          JSON.stringify({
            error: 'Configuration error',
            details: 'Database connection not properly configured'
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
      console.log('Updating episode with transcript');

      const { error: updateError } = await supabaseAdmin
        .from('episodes')
        .update({ transcript })
        .eq('id', episodeId);

      if (updateError) {
        console.error('Error updating episode:', updateError);
        return new Response(
          JSON.stringify({
            error: 'Database error',
            details: updateError.message
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('Successfully updated episode with transcript');
      return new Response(
        JSON.stringify({ success: true, transcript }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          } 
        }
      );

    } catch (error) {
      console.error('Error in transcribe-episode function:', error);
      
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          details: error.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Error in transcribe-episode function:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});