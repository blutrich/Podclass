import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LessonFormatSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const LessonFormatSelector = ({ value, onChange }: LessonFormatSelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px] md:w-[300px]">
        <SelectValue placeholder="Select format" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="summary">Quick Summary</SelectItem>
        <SelectItem value="lesson">Educational Lesson</SelectItem>
        <SelectItem value="guide">Step-by-Step Guide</SelectItem>
        <SelectItem value="quotes">Key Quotes</SelectItem>
        <SelectItem value="insights">Actionable Insights</SelectItem>
        <SelectItem value="personalized">Personalized Lesson</SelectItem>
        <SelectItem value="discussion">Discussion Questions</SelectItem>
        <SelectItem value="learning_plan">Learning Plan</SelectItem>
      </SelectContent>
    </Select>
  );
};