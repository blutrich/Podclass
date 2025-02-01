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
  const headers = {
    ...corsHeaders,
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };
  
  return new Response(
    JSON.stringify({ 
      data: null,
      error: {
        message,
        details,
        status
      }
    }),
    { 
      status: 200, // Always return 200 to handle CORS properly
      headers
    }
  );
};

const systemPrompt = `You are an expert educator creating a structured lesson from a podcast transcript. Your goal is to transform the content into an engaging, educational format that follows this specific structure:

1. Title (Required)
   - Create a compelling, focused title that captures the main topic
   - Maximum 10 words
   - Should be clear and engaging
   Example: "Building Resilient Teams: Leadership Strategies for Remote Work"

2. Summary (Required)
   - Write 2-3 clear paragraphs
   - Each paragraph should be 2-3 sentences
   - Cover the main themes and key messages
   - Provide context and importance of the topic

3. Key Takeaways (Required)
   - List exactly 3 main takeaways
   - Each takeaway should be:
     * One clear, actionable sentence
     * Directly tied to the content
     * Numbered (1, 2, 3)
     * Start with an action verb when possible

4. Core Concepts (Required)
   For each concept (provide exactly 3):
   {
     name: "Concept Name (short, memorable)",
     definition: "Clear 1-2 sentence explanation",
     quote: "Exact quote from transcript that best illustrates this concept",
     applications: [
       "3-4 practical ways to apply this concept",
       "Each application should be actionable",
       "Start with action verbs"
     ]
   }

5. Practical Examples (Required)
   For each example (provide exactly 2):
   {
     context: "One sentence setting up the example",
     quote: "Exact quote from transcript demonstrating the example",
     lesson: "One clear sentence explaining the key insight or learning"
   }

6. Action Steps (Required)
   - Provide exactly 3 concrete steps
   - Each step should be:
     * Actionable and specific
     * Directly related to the content
     * Numbered (1, 2, 3)
     * Start with an action verb

Format Requirements:
- Maintain consistent formatting throughout
- Use exact quotes from the transcript
- Keep all text concise and actionable
- Ensure each section has the exact number of items specified
- Use proper sentence case for all text
- Avoid placeholder or generic content

The output should be structured as valid JSON matching this format:
{
  "title": { "text": "Your Title Here" },
  "summary": { "paragraphs": ["First paragraph", "Second paragraph"] },
  "takeaways": {
    "items": [
      { "id": 1, "text": "First takeaway" },
      { "id": 2, "text": "Second takeaway" },
      { "id": 3, "text": "Third takeaway" }
    ]
  },
  "coreConcepts": [
    {
      "id": 1,
      "name": "Concept Name",
      "definition": "Concept definition",
      "quote": "Exact quote",
      "applications": ["Application 1", "Application 2", "Application 3"]
    }
  ],
  "practicalExamples": [
    {
      "id": 1,
      "context": "Example context",
      "quote": "Exact quote",
      "lesson": "Key lesson"
    }
  ],
  "actionSteps": [
    { "id": 1, "text": "First action step" },
    { "id": 2, "text": "Second action step" },
    { "id": 3, "text": "Third action step" }
  ]
}

Now, analyze the provided transcript and create a structured lesson following this format exactly.`;

// Update the extractSections function to handle the new format
const extractSections = (content: string) => {
  try {
    // Remove the XML-like tags if present, otherwise use the content as is
    const lessonContent = content.replace(/<educational_lesson>|<\/educational_lesson>/g, '').trim();

    // Extract title (single line after "Title:")
    const titleMatch = lessonContent.match(/Title:\s*\n?(.*?)(?=\n\s*\n|Summary:|$)/s);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract summary (paragraph after "Summary:")
    const summaryMatch = lessonContent.match(/Summary:\s*\n?([\s\S]*?)(?=\n\s*\nTop 3 Takeaways:|$)/);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';

    // Extract takeaways (bullet points after "Top 3 Takeaways:")
    const takeawaysMatch = lessonContent.match(/Top 3 Takeaways:\s*\n?([\s\S]*?)(?=\n\s*\nCore Concepts Explained:|$)/);
    const takeaways = takeawaysMatch 
      ? takeawaysMatch[1]
          .split('\n')
          .map(t => t.trim())
          .filter(t => t && !t.match(/^[•-]/) && t !== 'Top 3 Takeaways:')
      : [];

    // Extract core concepts
    const conceptsMatch = lessonContent.match(/Core Concepts Explained:\s*\n?([\s\S]*?)(?=\n\s*\nPractical Examples:|$)/);
    const concepts = conceptsMatch ? parseCoreConcepts(conceptsMatch[1]) : [];

    // Extract practical examples
    const examplesMatch = lessonContent.match(/Practical Examples:\s*\n?([\s\S]*?)(?=\n\s*\nAction Steps:|$)/);
    const examples = examplesMatch ? parsePracticalExamples(examplesMatch[1]) : [];

    // Extract action steps (bullet points after "Action Steps:")
    const stepsMatch = lessonContent.match(/Action Steps:\s*\n?([\s\S]*?)(?=\n\s*\n|$)/);
    const steps = stepsMatch
      ? stepsMatch[1]
          .split('\n')
          .map(s => s.trim())
          .filter(s => s && !s.match(/^[•-]/) && s !== 'Action Steps:')
      : [];

    // Validate that we have at least some content
    if (!title && !summary && !takeaways.length) {
      console.error('No valid content found in response');
      return null;
    }

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
  const conceptBlocks = conceptsText.split(/(?=\n[A-Za-z].*:)/).filter(block => block.trim());
  
  for (const block of conceptBlocks) {
    // Extract name (everything before the first colon)
    const nameMatch = block.match(/^([^:]+):/);
    if (!nameMatch) continue;
    
    const name = nameMatch[1].trim();
    const remainingText = block.slice(nameMatch[0].length).trim();
    
    // Extract definition (text until "Quote:" or "Application:")
    const definitionMatch = remainingText.match(/^([\s\S]*?)(?=Quote:|Application:|$)/);
    const definition = definitionMatch ? definitionMatch[1].trim() : '';
    
    // Extract quote (text between Quote: and Application:)
    const quoteMatch = remainingText.match(/Quote:\s*([\s\S]*?)(?=Application:|$)/);
    const quote = quoteMatch 
      ? quoteMatch[1].trim().replace(/^["']|["']$/g, '') // Remove surrounding quotes
      : '';
    
    // Extract applications (bullet points after Application:)
    const applicationMatch = remainingText.match(/Application:\s*([\s\S]*?)$/);
    const applications = applicationMatch 
      ? applicationMatch[1]
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && line.startsWith('•'))
          .map(line => line.replace(/^[•-]\s*/, ''))
      : [];
    
    concepts.push({
      name,
      what_it_is: definition,
      quote,
      how_to_apply: applications
    });
  }
  
  return concepts;
};

const parsePracticalExamples = (examplesText: string): any[] => {
  const examples = [];
  const exampleBlocks = examplesText.split(/(?=\n[A-Za-z].*:)/).filter(block => block.trim());
  
  for (const block of exampleBlocks) {
    // Extract context (text until Quote:)
    const contextMatch = block.match(/^([^:]+):\s*([\s\S]*?)(?=Quote:|$)/);
    if (!contextMatch) continue;
    
    const context = contextMatch[2].trim();
    const remainingText = block.slice(contextMatch[0].length).trim();
    
    // Extract quote (text between Quote: and Insight:)
    const quoteMatch = remainingText.match(/Quote:\s*([\s\S]*?)(?=Insight:|Lesson:|$)/);
    const quote = quoteMatch 
      ? quoteMatch[1].trim().replace(/^["']|["']$/g, '') // Remove surrounding quotes
      : '';
    
    // Extract lesson/insight
    const lessonMatch = remainingText.match(/(?:Insight|Lesson):\s*([\s\S]*?)$/);
    const lesson = lessonMatch ? lessonMatch[1].trim() : '';
    
    if (context || quote || lesson) {
      examples.push({ context, quote, lesson });
    }
  }
  
  return examples;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generate lesson function called');
    const { transcript, promptType } = await req.json();
    console.log('Received request with transcript length:', transcript?.length);

    if (!transcript) {
      console.log('No transcript provided');
      return createErrorResponse('Transcript is required');
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
            content: `Create a structured lesson from this transcript. Your response must be a valid JSON object matching the format specified in the system prompt. Do not include any text outside the JSON object. Here's the transcript:\n\n${transcript}` 
          }
        ],
        temperature: 0.7,
        max_tokens: 2500
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return createErrorResponse('Failed to generate lesson', 500, error);
    }

    console.log('Received response from OpenAI');
    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      console.log('No content in OpenAI response');
      return createErrorResponse('No content generated', 500);
    }

    console.log('Raw OpenAI response content:', content);
    
    try {
      // Parse the content to verify it's valid JSON
      const parsedContent = JSON.parse(content);
      console.log('Successfully parsed content:', JSON.stringify(parsedContent, null, 2));
      
      // Validate the structure
      if (!parsedContent.title?.text || !parsedContent.summary?.paragraphs || !parsedContent.takeaways?.items) {
        console.error('Invalid content structure:', parsedContent);
        return createErrorResponse('Generated content does not match required format', 500, parsedContent);
      }
      
      // Return success response with the parsed content
      return new Response(
        JSON.stringify({
          data: parsedContent,
          error: null
        }),
        { 
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (parseError) {
      console.error('Failed to parse generated content:', parseError);
      console.log('Raw content that failed to parse:', content);
      return createErrorResponse(
        'Failed to parse generated content',
        500,
        { content }
      );
    }

  } catch (error) {
    console.error('Error in generate-lesson function:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Unknown error occurred',
      500
    );
  }
});
