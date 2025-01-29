import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface EpisodeDescriptionProps {
  description: string;
  title: string;
}

export const EpisodeDescription = ({ description, title }: EpisodeDescriptionProps) => {
  if (!description) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: description }} />
        </div>
      </CardContent>
    </Card>
  );
};