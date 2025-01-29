import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const LESSON_PROMPT = `You will be creating an educational lesson based on a podcast transcript. The lesson should follow a specific format and include certain elements. Here's how to proceed:

First, carefully read through the provided podcast transcript, then create an educational lesson following these steps:

1. Title:
   - Create a concise, engaging title that summarizes the main topic of the podcast.
   - Limit it to a single line with a maximum of 10 words.

2. Summary:
   - Write 2-3 sentences that provide an overview of what the lesson covers.
   - Focus on the main themes or ideas discussed in the podcast.

3. Top 3 Takeaways:
   - Identify the three most important points from the podcast.
   - Express each takeaway as a single, clear sentence.

4. Core Concepts Explained:
   - Choose three key concepts discussed in the podcast.
   - For each concept:
     a) Provide a name for the concept.
     b) Explain what it is in 1-2 sentences.
     c) Include an exact quote from the transcript that relates to this concept.
     d) List 2-3 bullet points on how to apply this concept.

5. Practical Examples:
   - Select two examples from the podcast that illustrate key points.
   - For each example:
     a) Provide a one-sentence context.
     b) Include an exact quote from the transcript.
     c) Explain the lesson or insight from this example in one sentence.

6. Action Steps:
   - Create three actionable steps that listeners can take based on the podcast content.
   - Express each step as a single, clear instruction.

Important Format Rules:
- Include all sections in the exact order shown above.
- Use word-for-word quotes from the transcript where required.
- Keep all bullet points to single sentences.
- Use consistent bullet point symbols throughout.
- Maintain the exact spacing shown in the task description.
- Include all section headers exactly as written.`;

const QA_PROMPT = `You are a helpful teacher who answers questions about podcast episodes based on their transcripts.
Your role is to:
1. Answer questions accurately using ONLY information from the provided transcript
2. If the answer cannot be found in the transcript, say so clearly
3. Use quotes from the transcript to support your answers when relevant
4. Keep answers concise but informative
5. Maintain a friendly, educational tone

Format your responses in a clear, readable way:
- Use bullet points for lists
- Include relevant quotes in "quotation marks"
- Break up long answers into paragraphs
- Bold key terms or important points

If you cannot answer the question based on the transcript content, respond with:
"I cannot answer this question based on the transcript content. Would you like to ask something else about the episode?"`;

serve(async (req) => {
  console.log('Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Log OpenAI key status (safely)
    console.log('OpenAI API key status:', {
      exists: !!openAIApiKey,
      length: openAIApiKey?.length || 0
    });

    // Validate request
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'OpenAI API key not configured',
          details: 'Please configure the OPENAI_API_KEY environment variable'
        }),
        { 
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed:', {
        hasQuestion: !!requestBody?.question,
        questionLength: requestBody?.question?.length || 0,
        hasTranscript: !!requestBody?.transcript,
        transcriptLength: requestBody?.transcript?.length || 0
      });
    } catch (e) {
      console.error('Error parsing request body:', e);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request body',
          details: 'Failed to parse JSON body'
        }),
        { 
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const { question, transcript } = requestBody;
    
    // Enhanced input validation with detailed logging
    if (!question?.trim()) {
      console.error('Question validation failed: empty or missing');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Question is required',
          details: 'Please provide a more detailed question about the transcript'
        }),
        { 
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    if (!transcript?.trim()) {
      console.error('Transcript validation failed: empty or missing');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Transcript is required',
          details: 'No transcript provided for analysis'
        }),
        { 
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Log OpenAI request details
    console.log('Making OpenAI request:', {
      model: 'gpt-4',
      questionLength: question.length,
      transcriptLength: transcript.length,
      isLessonRequest: question.toLowerCase().includes('generate lesson')
    });

    // Make OpenAI request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: question.toLowerCase().includes('generate lesson') ? LESSON_PROMPT : QA_PROMPT
          },
          {
            role: 'user',
            content: question.toLowerCase().includes('generate lesson')
              ? `Please create an educational lesson from this transcript:\n\n${transcript}`
              : `Transcript:\n${transcript}\n\nQuestion: ${question}`
          }
        ],
        temperature: 0.7,
        max_tokens: question.toLowerCase().includes('generate lesson') ? 2000 : 1000,
      }),
    });

    // Log OpenAI response status
    console.log('OpenAI response status:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'OpenAI API error',
          details: error
        }),
        { 
          status: response.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const data = await response.json();
    console.log('OpenAI response parsed:', {
      hasChoices: !!data.choices,
      numChoices: data.choices?.length || 0,
      firstChoiceLength: data.choices?.[0]?.message?.content?.length || 0
    });

    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      console.error('No answer in OpenAI response:', data);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No answer received',
          details: 'The AI model did not provide an answer'
        }),
        { 
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true,
        answer,
        metadata: {
          questionLength: question.length,
          transcriptLength: transcript.length,
          answerLength: answer.length,
          type: question.toLowerCase().includes('generate lesson') ? 'lesson' : 'qa'
        }
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Unhandled error in ask-transcript function:', error);
    
    // Enhanced error response
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      details: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}); 