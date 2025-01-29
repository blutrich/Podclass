import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { episodeId, userId } = await req.json();
    console.log('Processing episode:', episodeId, 'for user:', userId);

    // Initialize Supabase client with admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get episode details and transcript
    const { data: episode, error: episodeError } = await supabaseAdmin
      .from('episodes')
      .select('*')
      .eq('id', episodeId)
      .single();

    if (episodeError || !episode) {
      throw new Error('Episode not found');
    }

    if (!episode.transcript) {
      throw new Error('No transcript available for this episode');
    }

    // Generate lesson content using OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional learning assistant. Create a structured lesson from the transcript with key takeaways, action steps, and reflection questions.'
          },
          {
            role: 'user',
            content: `Create a lesson from this transcript: ${episode.transcript}`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate lesson content');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse the content into structured sections
    const sections = {
      key_takeaways: content.match(/Key Takeaways:(.*?)(?=Action Steps:|$)/s)?.[1]
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(item => item.replace(/^[•-]\s*/, '')),
      action_steps: content.match(/Action Steps:(.*?)(?=Reflection Questions:|$)/s)?.[1]
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(item => item.replace(/^[•-]\s*/, '')),
      reflection_questions: content.match(/Reflection Questions:(.*?)$/s)?.[1]
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(item => item.replace(/^[•-]\s*/, '')),
    };

    // Create the lesson
    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('lessons')
      .insert({
        user_id: userId,
        episode_id: episodeId,
        lesson_content: sections,
        status: 'completed',
      })
      .select()
      .single();

    if (lessonError) {
      throw lessonError;
    }

    return new Response(
      JSON.stringify({ success: true, lesson }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in process-episode-to-lesson function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});