import { LessonSystem, LessonData } from '../lesson/LessonSystem';
import { Component, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface LessonDisplayProps {
  lesson: string;
}

// Error boundary for the lesson display
class LessonErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('LessonDisplay error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">Error Displaying Lesson</h3>
          </div>
          <p className="mt-2 text-red-700 dark:text-red-300">
            Sorry, there was an error displaying this lesson. Please try generating a new one.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Helper function to extract content between sections
function extractSection(text: string, sectionName: string, nextSectionNames: string[]): string {
  const sectionStart = text.indexOf(sectionName + ":");
  if (sectionStart === -1) return "";

  let sectionEnd = text.length;
  for (const nextSection of nextSectionNames) {
    const nextIndex = text.indexOf(nextSection + ":", sectionStart + sectionName.length);
    if (nextIndex !== -1 && nextIndex < sectionEnd) {
      sectionEnd = nextIndex;
    }
  }

  return text
    .substring(sectionStart + sectionName.length + 1, sectionEnd)
    .trim();
}

// Parse the lesson string into structured data
function parseLessonContent(lessonText: string): LessonData | null {
  try {
    // Remove the XML-like tags if present
    lessonText = lessonText.replace(/<educational_lesson>|<\/educational_lesson>/g, '').trim();

    const sections = [
      "Title",
      "Summary",
      "Top 3 Takeaways",
      "Core Concepts Explained",
      "Practical Examples",
      "Action Steps"
    ];

    // Extract each section
    const title = extractSection(lessonText, "Title", sections.slice(1));
    const summary = extractSection(lessonText, "Summary", sections.slice(2));
    const takeaways = extractSection(lessonText, "Top 3 Takeaways", sections.slice(3));
    const concepts = extractSection(lessonText, "Core Concepts Explained", sections.slice(4));
    const examples = extractSection(lessonText, "Practical Examples", sections.slice(5));
    const actions = extractSection(lessonText, "Action Steps", []);

    // Parse takeaways into array
    const takeawayItems = takeaways
      .split('\n')
      .filter(item => item.trim())
      .map((text, index) => ({
        id: index + 1,
        text: text.replace(/^[-•*]\s*/, '').trim()
      }));

    // Parse core concepts
    const conceptMatches = concepts.split(/(?=\w+:)/).filter(Boolean);
    const parsedConcepts = conceptMatches.map((concept, index) => {
      const nameMatch = concept.match(/^(.+?):/);
      const name = nameMatch ? nameMatch[1].trim() : `Concept ${index + 1}`;
      const content = concept.substring(nameMatch ? nameMatch[0].length : 0).trim();
      
      // Extract definition (first paragraph)
      const definition = content.split('\n')[0].trim();
      
      // Extract quote (content between quotes)
      const quoteMatch = content.match(/"([^"]+)"/);
      const quote = quoteMatch ? quoteMatch[1].trim() : '';
      
      // Extract applications (bullet points after the quote)
      const applications = content
        .substring(content.indexOf(quote) + quote.length)
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim());

      return {
        id: index + 1,
        name,
        definition,
        quote,
        applications
      };
    });

    // Parse practical examples
    const exampleMatches = examples.split(/(?=\d+\.)/).filter(Boolean);
    const parsedExamples = exampleMatches.map((example, index) => {
      const lines = example.split('\n').filter(Boolean);
      const context = lines[0].replace(/^\d+\.\s*/, '').trim();
      const quoteMatch = example.match(/"([^"]+)"/);
      const quote = quoteMatch ? quoteMatch[1].trim() : '';
      const lesson = lines[lines.length - 1].trim();

      return {
        id: index + 1,
        context,
        quote,
        lesson
      };
    });

    // Parse action steps
    const actionSteps = actions
      .split('\n')
      .filter(item => item.trim())
      .map((text, index) => ({
        id: index + 1,
        text: text.replace(/^[-•*]\s*/, '').trim()
      }));

    // Validate content
    if (!title || !summary || !takeawayItems.length) {
      return null;
    }

    return {
      title: { text: title },
      summary: { paragraphs: summary.split('\n').filter(Boolean) },
      takeaways: { items: takeawayItems },
      coreConcepts: parsedConcepts,
      practicalExamples: parsedExamples,
      actionSteps: actionSteps
    };
  } catch (error) {
    console.error('Error parsing lesson content:', error);
    return null;
  }
}

// Main component
export function LessonDisplay({ lesson }: LessonDisplayProps) {
  const lessonData = parseLessonContent(lesson);

  if (!lessonData) {
    return (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="font-semibold">Invalid Lesson Content</h3>
        </div>
        <p className="mt-2 text-yellow-700 dark:text-yellow-300">
          The lesson content appears to be invalid or empty. Please try generating a new lesson.
        </p>
      </div>
    );
  }

  return (
    <LessonErrorBoundary>
      <LessonSystem lesson={lessonData} />
    </LessonErrorBoundary>
  );
} 