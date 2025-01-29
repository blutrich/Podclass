import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, BookOpen, Target, Sparkles, Brain, ArrowRight, Clock, Calendar } from "lucide-react";
import { cn } from '@/lib/utils';

export interface LessonData {
  title: {
    text: string;
  };
  summary: {
    paragraphs: string[];
  };
  takeaways: {
    items: Array<{
      id: number;
      text: string;
    }>;
  };
  coreConcepts: Array<{
    id: number;
    name: string;
    definition: string;
    quote?: string;
    applications: string[];
  }>;
  practicalExamples: Array<{
    id: number;
    context: string;
    quote?: string;
    lesson: string;
  }>;
  actionSteps: Array<{
    id: number;
    text: string;
  }>;
}

interface LessonSystemProps {
  lesson: LessonData;
  loading?: boolean;
}

const Navigation = ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'concepts', label: 'Core Concepts', icon: Brain },
    { id: 'examples', label: 'Examples', icon: Sparkles },
    { id: 'actions', label: 'Action Steps', icon: Target },
  ];

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
      <div className="px-4">
        <TabsList className="h-auto bg-transparent border-0 p-0">
          <div className="flex overflow-x-auto py-2 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                    "data-[state=active]:bg-blue-500 data-[state=active]:text-white",
                    "data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-100",
                    "dark:data-[state=inactive]:text-gray-400 dark:data-[state=inactive]:hover:bg-gray-800"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </div>
        </TabsList>
      </div>
    </div>
  );
};

const Overview = ({ summary, takeaways }: { summary: LessonData['summary']; takeaways: LessonData['takeaways'] }) => (
  <div className="space-y-6">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Summary</h2>
      {summary.paragraphs.map((paragraph, idx) => (
        <p key={idx} className="text-gray-700 dark:text-gray-300 leading-relaxed">{paragraph}</p>
      ))}
    </div>

    <div className="space-y-4">
      {takeaways.items.map((takeaway) => (
        <div
          key={takeaway.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 flex items-start"
        >
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold mr-4">
            {takeaway.id}
          </div>
          <p className="text-gray-700 dark:text-gray-300">{takeaway.text}</p>
        </div>
      ))}
    </div>
  </div>
);

const CoreConcepts = ({ concepts }: { concepts: LessonData['coreConcepts'] }) => (
  <div className="space-y-6">
    {concepts.map((concept) => (
      <div
        key={concept.id}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {concept.name}
        </h3>
        <p className="text-gray-700 dark:text-gray-300 mb-4">{concept.definition}</p>
        {concept.quote && (
          <blockquote className="border-l-4 border-blue-500 dark:border-blue-600 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 rounded-r italic text-gray-700 dark:text-gray-300">
            "{concept.quote}"
          </blockquote>
        )}
        {concept.applications.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Applications:</h4>
            <ul className="space-y-2">
              {concept.applications.map((app, idx) => (
                <li key={idx} className="flex items-center text-gray-700 dark:text-gray-300">
                  <ArrowRight className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
                  {app}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    ))}
  </div>
);

const Examples = ({ examples }: { examples: LessonData['practicalExamples'] }) => (
  <div className="space-y-6">
    {examples.map((example) => (
      <div
        key={example.id}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
      >
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-semibold mr-3">
            {example.id}
          </div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100">{example.context}</h3>
        </div>
        {example.quote && (
          <blockquote className="border-l-4 border-green-500 dark:border-green-600 pl-4 py-2 my-4 bg-green-50 dark:bg-green-900/20 rounded-r italic text-gray-700 dark:text-gray-300">
            "{example.quote}"
          </blockquote>
        )}
        <div className="mt-4 flex items-start">
          <Lightbulb className="w-5 h-5 text-yellow-500 dark:text-yellow-400 mr-2 mt-1" />
          <p className="text-gray-700 dark:text-gray-300">{example.lesson}</p>
        </div>
      </div>
    ))}
  </div>
);

const ActionSteps = ({ steps }: { steps: LessonData['actionSteps'] }) => (
  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
    <div className="space-y-4">
      {steps.map((step) => (
        <div
          key={step.id}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm flex items-start"
        >
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-semibold mr-4">
            {step.id}
          </div>
          <p className="text-gray-700 dark:text-gray-300 pt-1">{step.text}</p>
        </div>
      ))}
    </div>
  </div>
);

export function LessonSystem({ lesson, loading = false }: LessonSystemProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return <LessonSkeleton />;
  }

  return (
    <Card className="w-full bg-white dark:bg-gray-900 shadow-xl">
      <div className="flex flex-col min-h-[700px]">
        {/* Title Section with Metadata */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {lesson.title.text}
          </h1>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>5 min read</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>Generated {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            <TabsContent value="overview" className="m-0">
              <Overview summary={lesson.summary} takeaways={lesson.takeaways} />
            </TabsContent>

            <TabsContent value="concepts" className="m-0">
              <CoreConcepts concepts={lesson.coreConcepts} />
            </TabsContent>

            <TabsContent value="examples" className="m-0">
              <Examples examples={lesson.practicalExamples} />
            </TabsContent>

            <TabsContent value="actions" className="m-0">
              <ActionSteps steps={lesson.actionSteps} />
            </TabsContent>
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}

function LessonSkeleton() {
  return (
    <Card className="w-full bg-white dark:bg-gray-900 shadow-xl animate-pulse">
      <div className="flex flex-col min-h-[700px]">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg w-2/3 mb-4"></div>
          <div className="flex space-x-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32"></div>
          </div>
        </div>
        <div className="p-2 border-b border-gray-200 dark:border-gray-800">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        </div>
        <div className="p-6 flex-1">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
} 