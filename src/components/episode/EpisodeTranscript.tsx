import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useState } from "react";

interface EpisodeTranscriptProps {
  transcript: string;
}

export const EpisodeTranscript: React.FC<EpisodeTranscriptProps> = ({ transcript }) => {
  const [showTranscript, setShowTranscript] = useState<boolean>(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Transcript</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTranscript(!showTranscript)}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          {showTranscript ? "Hide Transcript" : "Show Transcript"}
        </Button>
      </CardHeader>
      {showTranscript && (
        <CardContent>
          <div 
            className="prose dark:prose-invert max-w-none whitespace-pre-wrap"
            tabIndex={0}
            role="article"
            aria-label="Episode transcript"
          >
            {transcript}
          </div>
        </CardContent>
      )}
    </Card>
  );
};