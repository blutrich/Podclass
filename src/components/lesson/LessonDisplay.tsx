import { useState } from 'react';
import { Brain, Target, Lightbulb, BookOpen, HelpCircle } from 'lucide-react';

interface TabProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const Tab = ({ isActive, onClick, icon, label }: TabProps) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all
      ${isActive 
        ? 'bg-emerald-600/20 text-emerald-400 shadow-lg shadow-emerald-900/20' 
        : 'text-gray-400 hover:text-emerald-400 hover:bg-emerald-900/10'}`}
  >
    {icon}
    {label}
  </button>
);

interface LessonDisplayProps {
  lesson: string;
}

export function LessonDisplay({ lesson }: LessonDisplayProps) {
  const [activeTab, setActiveTab] = useState('key-takeaways');
  
  // Parse the lesson content
  const sections = {
    keyTakeaways: lesson.match(/Important Quote:.*?(?=###|$)/gs)?.[0] || '',
    insights: lesson.match(/### Conclusion:.*?(?=###|$)/gs)?.[0] || '',
    actionSteps: lesson.match(/Implementation Steps.*?(?=###|$)/gs)?.[0] || '',
    reflectionQuestions: lesson.match(/###.*Reflection Questions.*?(?=###|$)/gs)?.[0] || ''
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'key-takeaways':
        return (
          <div className="space-y-4">
            {sections.keyTakeaways.split('Important Quote:')
              .filter(quote => quote.trim())
              .map((quote, index) => (
                <div key={index} className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                  <p className="text-gray-300 leading-relaxed">"{quote.trim()}"</p>
                </div>
              ))}
          </div>
        );
      case 'insights':
        return (
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {sections.insights.replace('### Conclusion:', '').trim()}
            </p>
          </div>
        );
      case 'action-steps':
        return (
          <div className="space-y-4">
            {sections.actionSteps.split('\n')
              .filter(step => step.trim() && !step.includes('Implementation Steps'))
              .map((step, index) => (
                <div key={index} className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-1.5 rounded-full bg-emerald-600/20">
                      <Target className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-gray-300 leading-relaxed">{step.replace(/^[•-]\s*/, '')}</p>
                  </div>
                </div>
              ))}
          </div>
        );
      case 'reflection':
        return (
          <div className="space-y-4">
            {sections.reflectionQuestions.split('\n')
              .filter(question => question.trim() && !question.includes('Reflection Questions'))
              .map((question, index) => (
                <div key={index} className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-1.5 rounded-full bg-emerald-600/20">
                      <HelpCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-gray-300 leading-relaxed">{question.replace(/^[•-]\s*/, '')}</p>
                  </div>
                </div>
              ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-6 border-b border-gray-800">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <Tab
            isActive={activeTab === 'key-takeaways'}
            onClick={() => setActiveTab('key-takeaways')}
            icon={<Brain className="w-4 h-4" />}
            label="Key Takeaways"
          />
          <Tab
            isActive={activeTab === 'insights'}
            onClick={() => setActiveTab('insights')}
            icon={<Lightbulb className="w-4 h-4" />}
            label="Industry Insights"
          />
          <Tab
            isActive={activeTab === 'action-steps'}
            onClick={() => setActiveTab('action-steps')}
            icon={<Target className="w-4 h-4" />}
            label="Action Steps"
          />
          <Tab
            isActive={activeTab === 'reflection'}
            onClick={() => setActiveTab('reflection')}
            icon={<BookOpen className="w-4 h-4" />}
            label="Reflection"
          />
        </div>
      </div>
      
      <div className="p-6">
        {renderContent()}
      </div>
    </div>
  );
} 