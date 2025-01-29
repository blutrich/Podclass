import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Book, Trash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

interface Lesson {
  id: string;
  lesson_content: any;
  created_at: string;
  status: string;
  format_type: string;
}

export const LessonsSection = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['lessons'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to view lessons",
          variant: "destructive",
        });
        return [];
      }

      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching lessons:", error);
        throw error;
      }
      return data as Lesson[];
    },
  });

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      setIsDeleting(lessonId);
      const { error } = await supabase
        .from("lessons")
        .delete()
        .eq("id", lessonId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lesson deleted successfully",
      });
      
      // Refresh lessons list
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    } catch (error: any) {
      console.error("Error deleting lesson:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete lesson",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleViewLesson = (lessonId: string) => {
    navigate(`/episode/${lessonId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">My Lessons</h2>
      {lessons.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Book className="h-4 w-4 text-primary" />
                  <div>
                    <h3 className="font-medium">
                      {lesson.lesson_content.title || "Untitled Lesson"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(lesson.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewLesson(lesson.id)}
                  >
                    View
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteLesson(lesson.id)}
                    disabled={isDeleting === lesson.id}
                  >
                    {isDeleting === lesson.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            No lessons created yet. Start by searching for a podcast and creating your first lesson!
          </p>
        </Card>
      )}
    </div>
  );
};