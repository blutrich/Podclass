import React, { useState } from 'react';
import { BookOpen, Brain, Lightbulb, Target, ArrowRightCircle } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LessonData {
  title: {
    text: string;
    maxLength?: number;
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

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center mb-6 pb-2 border-b border-border">
    <Icon className="w-6 h-6 mr-2 text-emerald-500" />
    <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
  </div>
);

const QuoteBlock = ({ text }: { text: string }) => (
  <div className="relative px-4 py-3 my-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border-l-4 border-emerald-500">
    <div className="absolute -left-3 top-3 h-6 w-6 bg-background rounded-full flex items-center justify-center border-2 border-emerald-500">
      <span className="text-emerald-500 text-lg">"</span>
    </div>
    <p className="pl-4 italic text-muted-foreground">{text}</p>
  </div>
);

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const StyledCard = ({ children, className = "" }: CardProps) => (
  <Card className={cn("bg-background shadow-sm p-6", className)}>
    {children}
  </Card>
);

export const EnhancedLessonDisplay = ({ lesson }: { lesson: LessonData }) => {
  const [activeTab, setActiveTab] = useState('summary');

  const tabs = [
    { id: 'summary', label: 'Overview', icon: BookOpen },
    { id: 'concepts', label: 'Core Concepts', icon: Brain },
    { id: 'examples', label: 'Examples', icon: Lightbulb },
    { id: 'actions', label: 'Action Steps', icon: Target }
  ];

  return (
    <div className="bg-background">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Title Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {lesson.title.text}
          </h1>
          <div className="w-24 h-1 bg-emerald-500 mx-auto"></div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 bg-card rounded-lg shadow-sm p-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center px-4 py-2 rounded-md transition-colors",
                  activeTab === tab.id
                    ? "bg-emerald-500 text-white"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Summary Section */}
          {activeTab === 'summary' && (
            <div>
              <SectionHeader icon={BookOpen} title="Summary" />
              <StyledCard>
                {lesson.summary.paragraphs.map((para, idx) => (
                  <p key={idx} className="text-muted-foreground leading-relaxed mb-4">
                    {para}
                  </p>
                ))}
              </StyledCard>

              <div className="mt-8">
                <SectionHeader icon={Lightbulb} title="Key Takeaways" />
                <div className="grid gap-4">
                  {lesson.takeaways.items.map(item => (
                    <StyledCard key={item.id} className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 mr-4 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-semibold">
                        {item.id}
                      </div>
                      <p className="text-muted-foreground pt-1">{item.text}</p>
                    </StyledCard>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Core Concepts Section */}
          {activeTab === 'concepts' && (
            <div>
              <SectionHeader icon={Brain} title="Core Concepts" />
              <div className="space-y-6">
                {lesson.coreConcepts.map(concept => (
                  <StyledCard key={concept.id}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-semibold">
                        {concept.id}
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">
                        {concept.name}
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {/* Definition */}
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Definition</h4>
                        <p className="text-muted-foreground">{concept.definition}</p>
                      </div>

                      {/* Quote */}
                      {concept.quote && <QuoteBlock text={concept.quote} />}

                      {/* Applications */}
                      {concept.applications.length > 0 && (
                        <div>
                          <h4 className="font-medium text-foreground mb-2">How to Apply</h4>
                          <ul className="space-y-2">
                            {concept.applications.map((app, idx) => (
                              <li key={idx} className="flex items-center text-muted-foreground">
                                <ArrowRightCircle className="w-4 h-4 mr-2 text-emerald-500" />
                                {app}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </StyledCard>
                ))}
              </div>
            </div>
          )}

          {/* Examples Section */}
          {activeTab === 'examples' && (
            <div>
              <SectionHeader icon={Lightbulb} title="Practical Examples" />
              <div className="space-y-6">
                {lesson.practicalExamples.map(example => (
                  <StyledCard key={example.id}>
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-semibold mr-3">
                        {example.id}
                      </div>
                      <h3 className="font-medium text-foreground">{example.context}</h3>
                    </div>
                    {example.quote && <QuoteBlock text={example.quote} />}
                    <div className="mt-4 flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mr-3">
                        <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <p className="text-muted-foreground pt-1">{example.lesson}</p>
                    </div>
                  </StyledCard>
                ))}
              </div>
            </div>
          )}

          {/* Action Steps Section */}
          {activeTab === 'actions' && (
            <div>
              <SectionHeader icon={Target} title="Action Steps" />
              <div className="space-y-4">
                {lesson.actionSteps.map(step => (
                  <div 
                    key={step.id} 
                    className="flex items-center gap-4 p-4 bg-card hover:bg-accent transition-colors rounded-lg border border-border"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-semibold">
                      {step.id}
                    </div>
                    <p className="flex-1 text-muted-foreground text-lg">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedLessonDisplay; 