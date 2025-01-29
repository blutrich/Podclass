import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, FolderPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const UniversitySection = ({ lessonId }: { lessonId: string }) => {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const createFolder = async () => {
    try {
      setIsCreatingFolder(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to create folders",
          variant: "destructive",
        });
        return;
      }

      const { data: folder, error: folderError } = await supabase
        .from("folders")
        .insert({
          name: newFolderName,
          description: newFolderDescription,
          user_id: user.id,
        })
        .select()
        .single();

      if (folderError) throw folderError;

      if (lessonId && folder) {
        const { error: lessonError } = await supabase
          .from("folder_lessons")
          .insert({
            folder_id: folder.id,
            lesson_id: lessonId,
          });

        if (lessonError) {
          console.error("Error adding lesson to folder:", lessonError);
          throw lessonError;
        }
      }

      toast({
        title: "Success",
        description: "Folder created and lesson added successfully",
      });

      setNewFolderName("");
      setNewFolderDescription("");
      setIsDialogOpen(false);
      navigate("/university");
    } catch (error: any) {
      console.error("Error creating folder:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create folder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  return (
    <div className="space-y-4">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" variant="outline">
            <FolderPlus className="mr-2 h-4 w-4" />
            Create New Folder
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder="Description (optional)"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={createFolder}
              disabled={!newFolderName || isCreatingFolder}
            >
              {isCreatingFolder ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Folder"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};