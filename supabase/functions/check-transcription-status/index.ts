import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const { transcriptionId, episodeId } = await req.json();

    if (!transcriptionId || !episodeId) {
      throw new Error('Missing required parameters: transcriptionId and episodeId');
    }

    // Get AssemblyAI API key from environment variable
    const assemblyAIKey = Deno.env.get('ASSEMBLYAI_API_KEY');
    if (!assemblyAIKey) {
      throw new Error('AssemblyAI API key not configured');
    }

    // Initialize Supabase client with admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Check transcription status with AssemblyAI
    const response = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptionId}`, {
      headers: {
        'Authorization': assemblyAIKey
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('AssemblyAI status check error:', errorData);
      throw new Error('Failed to check transcription status');
    }

    const result = await response.json();
    console.log('Transcription status:', result);

    if (result.status === 'completed') {
      // Update the episode with the transcript using admin privileges
      const { error: updateError } = await supabaseAdmin
        .from('episodes')
        .update({ transcript: result.text })
        .eq('id', episodeId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ 
          status: 'completed',
          transcript: result.text
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (result.status === 'error') {
      throw new Error(result.error || 'Transcription failed');
    }

    return new Response(
      JSON.stringify({ status: result.status }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-transcription-status function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 