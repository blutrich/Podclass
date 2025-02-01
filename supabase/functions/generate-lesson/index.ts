import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, origin',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

// Helper function to create error responses
const createErrorResponse = (message: string, status = 400, details?: any) => {
  console.error(`Error: ${message}`, details);
  return new Response(
    JSON.stringify({ 
      error: { message, details, status }
    }),
    { 
      status,
      headers: corsHeaders
    }
  );
};

const systemPrompt = `You are an expert educator creating a structured lesson from a podcast transcript. Your goal is to transform the content into an engaging, educational format that follows this specific structure:

1. Title
   - Create a compelling, focused title that captures the main topic
   - Maximum 10 words
   - Should be clear and engaging

2. Summary
   - Write 2-3 clear paragraphs explaining the main points
   - Focus on key insights and value

3. Key Takeaways (exactly 3)
   - List the three most important lessons
   - Make them actionable and clear

4. Core Concepts (exactly 3)
   - Name: Short, memorable title
   - What it is: Clear 1-2 sentence explanation
   - Quote: Relevant quote from the transcript
   - How to apply: 3-4 bullet points with practical applications

5. Practical Examples (exactly 2)
   - Context: One sentence setup
   - Quote: Relevant quote from the transcript
   - Lesson: Key insight from the example

6. Action Steps (exactly 3)
   - Concrete, actionable steps
   - Start with verbs
   - Make them specific and achievable

Your response must be valid JSON matching this exact format:
{
  "title": "The Title Here",
  "summary": "The full summary text here...",
  "key_takeaways": [
    "First takeaway",
    "Second takeaway",
    "Third takeaway"
  ],
  "core_concepts": [
    {
      "name": "Concept Name",
      "what_it_is": "Explanation",
      "quote": "Quote from transcript",
      "how_to_apply": ["Step 1", "Step 2", "Step 3"]
    }
  ],
  "practical_examples": [
    {
      "context": "Example setup",
      "quote": "Quote from transcript",
      "lesson": "Key insight"
    }
  ],
  "action_steps": [
    "First action step",
    "Second action step",
    "Third action step"
  ]
}`;

serve(async (req) => {
  console.log('Request received:', req.method);
  console.log('OpenAI API Key configured:', !!openAIApiKey);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Request body received:', JSON.stringify({ 
      hasTranscript: !!body.transcript,
      transcriptLength: body.transcript?.length
    }));
    
    const { transcript } = body;
    
    if (!transcript) {
      return createErrorResponse('Transcript is required');
    }

    if (!openAIApiKey) {
      return createErrorResponse('OpenAI API key is not configured', 500);
    }

    console.log('Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Create a structured lesson from this transcript. Ensure your response is valid JSON matching the format specified. Transcript:\n\n${transcript}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2500
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return createErrorResponse('Failed to generate lesson', 500, {
        status: response.status,
        statusText: response.statusText,
        error
      });
    }

    const result = await response.json();
    console.log('OpenAI API response received');
    
    const content = result.choices[0]?.message?.content;
    if (!content) {
      console.error('No content in OpenAI response:', result);
      return createErrorResponse('No content generated', 500, { result });
    }

    console.log('Parsing OpenAI response...');
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error, 'Content:', content);
      return createErrorResponse('Invalid JSON response from AI', 500, { 
        error: error.message,
        content 
      });
    }

    // Validate the content structure
    const requiredFields = ['title', 'summary', 'key_takeaways', 'core_concepts', 'practical_examples', 'action_steps'];
    const missingFields = requiredFields.filter(field => !parsedContent[field]);
    
    if (missingFields.length > 0) {
      console.error('Invalid content structure. Missing fields:', missingFields);
      return createErrorResponse('Generated content is missing required fields', 500, {
        missingFields,
        content: parsedContent
      });
    }

    console.log('Successfully generated and validated lesson');
    return new Response(
      JSON.stringify({ data: parsedContent }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in generate-lesson function:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Unknown error occurred',
      500,
      error instanceof Error ? { 
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    );
  }
});
