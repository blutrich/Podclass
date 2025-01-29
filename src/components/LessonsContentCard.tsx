import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface LessonContentCardProps {
  title: string;
  items: string[];
}

export const LessonContentCard = ({ title, items }: LessonContentCardProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {items.map((item: string, index: number) => {
          // Check if the item appears to be a heading (ends with a colon)
          const isHeading = item.trim().endsWith(':');
          
          if (isHeading) {
            return (
              <div key={index} className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">
                  {item.slice(0, -1)} {/* Remove the colon */}
                </h2>
              </div>
            );
          }
          
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