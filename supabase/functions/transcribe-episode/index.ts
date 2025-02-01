import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Parse request body
    const requestData = await req.json().catch(error => {
      console.error('Error parsing request body:', error);
      throw new Error('Invalid request body');
    });

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
        language_code: 'en',
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
    console.error('Error in transcribe-episode function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
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