import { Card } from "@/components/ui/card";

interface LessonContentProps {
  content: {
    title: string;
    summary: string;
    key_takeaways: string[];
    core_concepts: Array<{
      name: string;
      what_it_is: string;
      quote: string;
      how_to_apply: string[];
    }>;
    practical_examples: Array<{
      context: string;
      quote: string;
      lesson: string;
    }>;
    action_steps: string[];
  };
}

export function LessonContent({ content }: LessonContentProps) {
  if (!content) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8">
      {/* Title */}
      <div className="border-b pb-6">
        <h1 className="text-4xl font-extrabold tracking-tight">
          {content.title}
        </h1>
      </div>

      {/* Summary */}
      {content.summary && (
        <Card className="p-6 space-y-4">
          <h2 className="text-2xl font-bold">Summary</h2>
          <div className="prose prose-lg dark:prose-invert">
            <p>{content.summary}</p>
          </div>
        </Card>
      )}

      {/* Key Takeaways */}
      {content.key_takeaways?.length > 0 && (
        <Card className="p-6 space-y-4">
          <h2 className="text-2xl font-bold">Key Takeaways</h2>
          <ol className="list-decimal pl-6 space-y-4">
            {content.key_takeaways.map((takeaway, index) => (
              <li key={index} className="text-lg leading-relaxed">
                {takeaway}
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Core Concepts */}
      {content.core_concepts?.length > 0 && (
        <Card className="p-6 space-y-8">
          <h2 className="text-2xl font-bold">Core Concepts</h2>
          <div className="divide-y space-y-8">
            {content.core_concepts.map((concept, index) => (
              <div key={index} className="pt-8 first:pt-0 space-y-4">
                <h3 className="text-xl font-semibold">
                  {concept.name}
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Definition
                    </h4>
                    <p className="text-lg">
                      {concept.what_it_is}
                    </p>
                  </div>
                  {concept.quote && (
                    <div>
                      <h4 className="font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Quote
                      </h4>
                      <blockquote className="text-lg italic border-l-4 pl-4 py-1">
                        "{concept.quote}"
                      </blockquote>
                    </div>
                  )}
                  {concept.how_to_apply?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Applications
                      </h4>
                      <ul className="list-disc pl-6 space-y-2">
                        {concept.how_to_apply.map((point, i) => (
                          <li key={i} className="text-lg">
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Practical Examples */}
      {content.practical_examples?.length > 0 && (
        <Card className="p-6 space-y-8">
          <h2 className="text-2xl font-bold">Practical Examples</h2>
          <div className="divide-y space-y-8">
            {content.practical_examples.map((example, index) => (
              <div key={index} className="pt-8 first:pt-0 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Context
                  </h4>
                  <p className="text-lg">
                    {example.context}
                  </p>
                </div>
                {example.quote && (
                  <div>
                    <h4 className="font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Quote
                    </h4>
                    <blockquote className="text-lg italic border-l-4 pl-4 py-1">
                      "{example.quote}"
                    </blockquote>
                  </div>
                )}
                {example.lesson && (
                  <div>
                    <h4 className="font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Key Insight
                    </h4>
                    <p className="text-lg">
                      {example.lesson}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action Steps */}
      {content.action_steps?.length > 0 && (
        <Card className="p-6 space-y-4">
          <h2 className="text-2xl font-bold">Action Steps</h2>
          <ol className="list-decimal pl-6 space-y-4">
            {content.action_steps.map((step, index) => (
              <li key={index} className="text-lg leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
} 