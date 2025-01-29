import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SaveLessonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lessonContent: any;
  episodeId: string;
  formatType?: string;
}

export function SaveLessonDialog({ 
  isOpen, 
  onClose, 
  lessonContent, 
  episodeId,
  formatType = 'summary' 
}: SaveLessonDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSaveLesson = async () => {
    try {
      console.log('Starting to save lesson...');
      console.log('Lesson content:', lessonContent);
      console.log('Episode ID:', episodeId);
      console.log('Format type:', formatType);
      
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found');
        toast({
          title: "Authentication required",
          description: "Please sign in to save lessons",
          variant: "destructive",
        });
        return;
      }

      console.log('Authenticated user:', user.id);
      console.log('Inserting lesson into database...');

      const { data, error } = await supabase
        .from("lessons")
        .insert({
          user_id: user.id,
          episode_id: episodeId,
          lesson_content: lessonContent,
          format_type: formatType,
          status: 'completed'
        })
        .select();

      if (error) {
        console.error("Error details:", error);
        throw error;
      }

      console.log('Lesson saved successfully:', data);

      toast({
        title: "Success",
        description: "Lesson saved successfully",
      });
      
      // Force reload the lessons query
      window.location.reload();
      
      onClose();
    } catch (error: any) {
      console.error("Error saving lesson:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save lesson",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !isSaving && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Lesson</DialogTitle>
          <DialogDescription>
            Save this lesson to your library for future reference. You can access it anytime from your dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveLesson}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Lesson'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}