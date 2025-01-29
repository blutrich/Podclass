import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface LessonContentCardProps {
  title: string;
  items: string[];
}

export const LessonContentCard = ({ title, items }: LessonContentCardProps) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Card className="w-full bg-card">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {items.map((item: string, index: number) => {
          // Check if the item is a heading (starts with ** or contains "Quotes:")
          const isHeading = item.startsWith('**') || item.includes('Quotes:');
          
          if (isHeading) {
            let headingText = item;
            // Remove ** markers if present
            if (item.startsWith('**')) {
              headingText = item.replace(/\*\*/g, '');
              // Remove the colon if it exists
              const colonIndex = headingText.indexOf(':');
              if (colonIndex !== -1) {
                headingText = headingText.substring(0, colonIndex);
              }
            }
            
            return (
              <div key={index} className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {headingText}
                </h3>
              </div>
            );
          }
          
          // Check if the item is a quote (starts with a quotation mark)
          const isQuote = item.trim().startsWith('"');
          
          if (isQuote) {
            return (
              <div key={index} className="pl-4 border-l-4 border-primary/30 italic">
                <p className="text-sm md:text-base text-muted-foreground">
                  {item}
                </p>
              </div>
            );
          }
          
          // Regular content
          return (
            <div key={index} className="pl-4 border-l-2 border-primary/20">
              <p className="text-sm md:text-base text-muted-foreground">
                {item}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};