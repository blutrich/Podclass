import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, origin',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Log request details
  console.log('Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('No authorization header');
    }

    // Handle test requests
    const requestData = await req.json();
    if (requestData.test) {
      console.log('Received test request');
      return new Response(
        JSON.stringify({ success: true, message: 'Edge Function is accessible' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { audioUrl, episodeId } = requestData;
    console.log('Processing request for episode:', episodeId, 'with audio:', audioUrl);

    if (!audioUrl || !episodeId) {
      throw new Error('Missing required parameters: audioUrl and episodeId are required');
    }

    const assemblyAIKey = Deno.env.get('ASSEMBLYAI_API_KEY');
    if (!assemblyAIKey) {
      throw new Error('AssemblyAI API key not configured');
    }

    // Initialize AssemblyAI transcription
    console.log('Initiating transcription with AssemblyAI');
    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': assemblyAIKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_detection: true,
        speaker_labels: true,
        auto_chapters: true
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AssemblyAI API error:', errorText);
      throw new Error(`Failed to initiate transcription: ${errorText}`);
    }

    const transcriptionData = await response.json();
    console.log('Transcription initiated:', transcriptionData);

    // Poll for transcription completion
    const checkTranscription = async (transcriptId: string): Promise<string> => {
      console.log('Checking transcription status for:', transcriptId);
      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': assemblyAIKey,
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
      throw new Error('Supabase configuration missing');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    console.log('Updating episode with transcript');

    const { error: updateError } = await supabaseAdmin
      .from('episodes')
      .update({ transcript })
      .eq('id', episodeId);

    if (updateError) {
      console.error('Error updating episode:', updateError);
      throw updateError;
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
    console.error('Error in transcribe-episode function:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    });

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof error
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
      }
    );
  }
});