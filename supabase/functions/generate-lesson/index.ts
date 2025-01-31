import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Add type declarations for Deno env
declare global {
  interface Window {
    Deno: {
      env: {
        get(key: string): string | undefined;
      };
    };
  }
}

interface KeyTakeaway {
  name: string;
  what_it_is: string;
  quote: string;
  how_to_apply: string[];
}

interface QuoteLesson {
  context: string;
  quote: string;
  lesson: string;
}

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Helper function to create error responses
const createErrorResponse = (message: string, status = 400, details?: any) => {
  return new Response(
    JSON.stringify({ 
      error: message,
      details,
      status
    }),
    { 
      status,
      headers: corsHeaders
    }
  );
};

const systemPrompt = `You will be creating an educational lesson based on a podcast transcript. Create a structured lesson with these exact sections and format:

Title:
[A single line, maximum 10 words, summarizing the main topic]

Summary:
[2-3 sentences providing an overview of the lesson content and main themes]

Top 3 Takeaways:
[Three clear, single-sentence takeaways from the content, each on a new line with a bullet point]

Core Concepts Explained:
[For each of the three main concepts, include:]

[Concept Name]
Definition: [1-2 sentences explaining the concept]
Quote: [Exact quote from transcript that illustrates this concept]
Application:
• [3 bullet points on how to apply this concept]

Practical Examples:
[For each of two examples:]

[Example Name]
Context: [One sentence providing context]
Quote: [Exact quote from transcript]
Insight: [One sentence explaining the key lesson]

Action Steps:
[Three clear, actionable steps, each on a new line with a bullet point]

Important Format Rules:
- Keep all bullet points consistent
- Use exact quotes from the transcript
- Maintain precise spacing and formatting
- Keep all sections in this exact order
- Use clear, concise language throughout

Output the lesson within <educational_lesson> tags.`;

// Update the extractSections function to handle the new format
const extractSections = (content: string): any => {
  try {
    // Extract content between educational_lesson tags
    const lessonMatch = content.match(/<educational_lesson>([\s\S]*?)<\/educational_lesson>/);
    if (!lessonMatch) {
      console.error('No educational_lesson tags found in content');
      return null;
    }
    
    const lessonContent = lessonMatch[1];

    // Extract title (single line after "Title:")
    const titleMatch = lessonContent.match(/Title:\s*\n(.*?)(?=\n\s*\n|$)/s);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract summary (paragraph after "Summary:")
    const summaryMatch = lessonContent.match(/Summary:\s*\n([\s\S]*?)(?=\n\s*\nTop 3 Takeaways:|$)/);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';

    // Extract takeaways (bullet points after "Top 3 Takeaways:")
    const takeawaysMatch = lessonContent.match(/Top 3 Takeaways:\s*\n([\s\S]*?)(?=\n\s*\nCore Concepts Explained:|$)/);
    const takeaways = takeawaysMatch 
      ? takeawaysMatch[1]
          .split('\n')
          .map(t => t.trim())
          .filter(t => t && !t.match(/^[•-]/) && t !== 'Top 3 Takeaways:')
      : [];

    // Extract core concepts
    const conceptsMatch = lessonContent.match(/Core Concepts Explained:\s*\n([\s\S]*?)(?=\n\s*\nPractical Examples:|$)/);
    const concepts = conceptsMatch ? parseCoreConcepts(conceptsMatch[1]) : [];

    // Extract practical examples
    const examplesMatch = lessonContent.match(/Practical Examples:\s*\n([\s\S]*?)(?=\n\s*\nAction Steps:|$)/);
    const examples = examplesMatch ? parsePracticalExamples(examplesMatch[1]) : [];

    // Extract action steps (bullet points after "Action Steps:")
    const stepsMatch = lessonContent.match(/Action Steps:\s*\n([\s\S]*?)(?=\n\s*\n|$)/);
    const steps = stepsMatch
      ? stepsMatch[1]
          .split('\n')
          .map(s => s.trim())
          .filter(s => s && !s.match(/^[•-]/) && s !== 'Action Steps:')
      : [];

    return {
      title,
      summary,
      top_takeaways: takeaways,
      core_concepts: concepts,
      practical_examples: examples,
      action_steps: steps
    };
  } catch (error) {
    console.error('Error parsing sections:', error);
    return null;
  }
};

const parseCoreConcepts = (conceptsText: string): any[] => {
  const concepts = [];
  const conceptBlocks = conceptsText.split(/(?=\n[a-zA-Z].*:)/);
  
  for (const block of conceptBlocks) {
    if (!block.trim()) continue;
    
    const nameMatch = block.match(/^(.*?):/);
    const whatMatch = block.match(/Definition:\s*(.*?)(?=Quote:|$)/s);
    const quoteMatch = block.match(/Quote:\s*(.*?)(?=Application:|$)/s);
    const applyMatch = block.match(/Application:\s*(.*?)(?=$)/s);
    
    if (nameMatch) {
      concepts.push({
        name: nameMatch[1].trim(),
        what_it_is: whatMatch ? whatMatch[1].trim() : '',
        quote: quoteMatch ? quoteMatch[1].trim() : '',
        how_to_apply: applyMatch 
          ? applyMatch[1]
              .split('\n')
              .map(p => p.trim())
              .filter(p => p && !p.match(/^[•-]/))
          : []
      });
    }
  }
  
  return concepts;
};

const parsePracticalExamples = (examplesText: string): any[] => {
  const examples = [];
  const exampleBlocks = examplesText.split(/(?=\n[a-zA-Z].*:)/);
  
  for (const block of exampleBlocks) {
    if (!block.trim()) continue;
    
    const contextMatch = block.match(/Context:\s*(.*?)(?=Quote:|$)/s);
    const quoteMatch = block.match(/Quote:\s*(.*?)(?=Lesson:|$)/s);
    const lessonMatch = block.match(/Lesson:\s*(.*?)(?=$)/s);
    
    if (contextMatch) {
      examples.push({
        context: contextMatch[1].trim(),
        quote: quoteMatch ? quoteMatch[1].trim() : '',
        lesson: lessonMatch ? lessonMatch[1].trim() : ''
      });
    }
  }
  
  return examples;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generate lesson function called');
    
    // Parse request body
    const requestData = await req.json().catch(error => {
      console.error('Error parsing request body:', error);
      return createErrorResponse('Invalid request body format', 400, error);
    });
    
    const { episodeId, transcript, promptType = 'summary' } = requestData;
    
    console.log('Request parameters:', { 
      episodeId, 
      transcriptLength: transcript?.length,
      promptType 
    });

    // Validate inputs
    if (!episodeId) {
      return createErrorResponse('Episode ID is required', 400);
    }

    if (!transcript || transcript.trim().length === 0) {
      console.error('No transcript provided for episode:', episodeId);
      return createErrorResponse('Transcript is required and cannot be empty', 400);
    }

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return createErrorResponse('OpenAI API key not configured', 500);
    }

    console.log('Making OpenAI API request...');
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
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Please analyze this podcast transcript and create a structured lesson following the format specified: ${transcript}`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return createErrorResponse('OpenAI API error', response.status, error);
    }

    const data = await response.json();
    console.log('OpenAI API response received');

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response format:', data);
      return createErrorResponse('Invalid response from OpenAI', 500, data);
    }

    const content = data.choices[0].message.content;
    console.log('Raw content from OpenAI:', content);

    // Extract sections using the new helper function
    const structuredContent = extractSections(content);
    
    if (!structuredContent) {
      console.error('Failed to parse content sections. Raw content:', content);
      return createErrorResponse('Failed to extract content sections', 500, { content });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        content: structuredContent
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Unexpected error in generate-lesson function:', error);
    return createErrorResponse(
      'Unexpected error processing request',
      500,
      error instanceof Error ? { message: error.message, stack: error.stack } : error
    );
  }
});
