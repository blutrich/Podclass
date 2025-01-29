import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface LessonContentCardProps {
  title: string;
  items: string[];
}

export const LessonContentCard = ({ title, items }: LessonContentCardProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc pl-6 space-y-2">
          {items.map((item: string, index: number) => (
            <li key={index} className="text-sm md:text-base">{item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};