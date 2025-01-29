import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LessonDisplay } from "./LessonDisplay";

// Constants for validation and chunking
const MIN_QUESTION_LENGTH = 15;
const MIN_TRANSCRIPT_LENGTH = 100;
const MAX_TRANSCRIPT_LENGTH = 30000; // Reduced from 100000 to 30000
const CHUNK_SIZE = 25000; // Size of each transcript chunk

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'lesson' | 'qa';
  error?: boolean;
}

interface TranscriptChatProps {
  transcript: string;
}

// Utility functions for transcript preprocessing
function preprocessTranscript(transcript: string): string {
  return transcript
    .replace(/\[.*?\]/g, '') // Remove timestamp markers
    .replace(/\((.*?)\)/g, '') // Remove parenthetical notes
    .replace(/Speaker\s*\d+:/gi, '') // Remove speaker labels
    .replace(/\n{3,}/g, '\n\n') // Normalize spacing
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

// New function to chunk transcript
function chunkTranscript(transcript: string): string[] {
  const words = transcript.split(' ');
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    if (currentLength + word.length + 1 > CHUNK_SIZE) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [word];
      currentLength = word.length + 1;
    } else {
      currentChunk.push(word);
      currentLength += word.length + 1;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

// Utility function to detect potential issues with transcript
function validateTranscript(transcript: string): { isValid: boolean; error?: string } {
  if (!transcript?.trim()) {
    return { isValid: false, error: 'No transcript is available for this episode.' };
  }

  const cleanedTranscript = preprocessTranscript(transcript);

  if (cleanedTranscript.length < MIN_TRANSCRIPT_LENGTH) {
    return { isValid: false, error: 'The transcript is too short to process.' };
  }

  return { isValid: true };
}

export function TranscriptChat({ transcript }: TranscriptChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isLessonRequest = (text: string) => {
    const phrases = [
      'generate lesson',
      'create lesson',
      'make lesson',
      'lesson from',
      'create a lesson',
      'generate a lesson'
    ];
    return phrases.some(phrase => text.toLowerCase().includes(phrase));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Clean user input
    const userMessage = input.trim()
      .split('...')[0] // Remove any example text
      .replace(/^(hi|hey|hello)\s*/i, '') // Remove greeting prefixes
      .trim();
    
    const isLesson = isLessonRequest(userMessage);
    
    // Input validation
    if (userMessage.length < MIN_QUESTION_LENGTH) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Please ask a complete question about the episode content. For example:\n"What are the main topics discussed in this episode?"\n"What training techniques are mentioned?"',
        type: 'qa',
        error: true
      }]);
      setInput('');
      return;
    }

    // Validate transcript
    const transcriptValidation = validateTranscript(transcript);
    if (!transcriptValidation.isValid) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: transcriptValidation.error || 'There was an issue with the transcript.',
        type: 'qa',
        error: true
      }]);
      return;
    }

    setInput('');
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage,
      type: isLesson ? 'lesson' : 'qa'
    }]);
    setIsLoading(true);

    try {
      // Preprocess transcript
      const cleanedTranscript = preprocessTranscript(transcript);

      // Split transcript into chunks if it's too large
      const transcriptChunks = cleanedTranscript.length > MAX_TRANSCRIPT_LENGTH 
        ? chunkTranscript(cleanedTranscript)
        : [cleanedTranscript];

      console.log('Processing transcript:', {
        originalLength: transcript.length,
        cleanedLength: cleanedTranscript.length,
        chunks: transcriptChunks.length,
        chunkSizes: transcriptChunks.map(chunk => chunk.length)
      });

      // Process each chunk
      let combinedAnswer = '';
      for (let i = 0; i < transcriptChunks.length; i++) {
        const chunk = transcriptChunks[i];
        const isLastChunk = i === transcriptChunks.length - 1;

        const requestBody = {
          question: userMessage,
          transcript: chunk,
          type: isLesson ? 'lesson' : 'qa',
          metadata: {
            transcriptLength: chunk.length,
            questionLength: userMessage.length,
            hasTimestamps: transcript.includes('['),
            hasSpeakerLabels: /Speaker\s*\d+:/i.test(transcript),
            chunkIndex: i,
            totalChunks: transcriptChunks.length
          }
        };

        const { data, error } = await supabase.functions.invoke('ask-transcript', {
          body: requestBody
        });

        if (error) {
          console.error('Supabase function error:', {
            message: error.message,
            name: error.name,
            status: error?.status,
            details: error?.details,
            hint: error?.hint,
            chunk: i + 1,
            totalChunks: transcriptChunks.length
          });

          // Only throw error if it's the first chunk or a critical error
          if (i === 0 || error.message.includes('500')) {
            let errorMessage = 'Sorry, I encountered an error while processing your request.';
            
            if (error.message.includes('400') || error.message.includes('Bad Request')) {
              errorMessage = 'The transcript is too complex to process. Please try:\n\n' +
                '1. Asking about a specific topic or section\n' +
                '2. Using shorter, more focused questions\n' +
                '3. Generating a lesson instead';
            } else if (error.message.includes('non-2xx status code')) {
              errorMessage = 'The server is currently unavailable. Please try again in a few moments.';
            } else if (error.message.includes('timeout')) {
              errorMessage = 'The request took too long. Please try asking a more specific question.';
            }
            
            throw new Error(errorMessage);
          }
        }

        if (data?.answer) {
          combinedAnswer += (combinedAnswer ? '\n\n' : '') + data.answer;
        }

        // If we have a complete answer, no need to process more chunks
        if (isLastChunk || combinedAnswer.includes('I apologize') || combinedAnswer.includes('I cannot find')) {
          break;
        }
      }

      if (!combinedAnswer) {
        throw new Error('I was unable to find relevant information in the transcript. Please try:\n\n' +
          '1. Asking about a different topic\n' +
          '2. Rephrasing your question\n' +
          '3. Being more specific about what you want to know');
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: combinedAnswer,
        type: isLesson ? 'lesson' : 'qa'
      }]);
    } catch (error) {
      console.error('Error asking question:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: error instanceof Error 
          ? error.message 
          : 'Sorry, I encountered an error. Please try asking a specific question about the episode content.',
        type: 'qa',
        error: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Log when component mounts or transcript changes
  useEffect(() => {
    const validation = validateTranscript(transcript);
    console.log('TranscriptChat mounted/updated:', {
      hasTranscript: !!transcript,
      transcriptLength: transcript?.length || 0,
      transcriptPreview: transcript?.slice(0, 100),
      isValid: validation.isValid,
      validationError: validation.error
    });
  }, [transcript]);

  return (
    <div className="rounded-xl shadow-lg bg-gray-900 border border-gray-800">
      <div className="p-6 border-b border-gray-800">
        <h3 className="text-2xl font-bold text-white">Ask Questions or Generate Lessons</h3>
        <p className="text-gray-300 mt-2">
          Ask questions about the episode or type "generate lesson" to create an educational lesson from the content.
        </p>
      </div>

      <div className="h-[600px] flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] ${
                  message.role === 'user'
                    ? 'bg-emerald-600/20 text-emerald-100 border border-emerald-800/50 rounded-2xl rounded-tr-none shadow-lg shadow-emerald-900/20'
                    : message.type === 'lesson'
                    ? 'w-full'
                    : message.error
                    ? 'bg-red-900/20 border border-red-800/50 text-red-200 rounded-2xl rounded-tl-none shadow-lg'
                    : 'bg-gray-800/80 border border-gray-700 text-gray-100 rounded-2xl rounded-tl-none shadow-lg'
                } p-4`}
              >
                {message.role === 'assistant' && message.type === 'lesson' ? (
                  <LessonDisplay lesson={message.content} />
                ) : (
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                    message.role === 'user' 
                      ? 'text-emerald-100' 
                      : message.error 
                      ? 'text-red-200'
                      : 'text-gray-100'
                  }`}>
                    {message.content}
                  </p>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-4 rounded-2xl rounded-tl-none bg-gray-800/80 border border-gray-700 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/80">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question or type 'generate lesson'..."
              className="flex-1 bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 
                focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all
                hover:bg-gray-800/80"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg 
                hover:shadow-emerald-900/20 transition-all disabled:opacity-50 
                disabled:cursor-not-allowed px-6 disabled:hover:bg-emerald-600"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 