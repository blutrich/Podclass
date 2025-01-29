import { AppLayout } from "@/components/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FolderOpen, BookOpen } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useSessionContext } from '@supabase/auth-helpers-react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

export const UniversityPage = () => {
  const navigate = useNavigate();
  const { folderId } = useParams();
  const { session, isLoading: isLoadingSession } = useSessionContext();
  const { toast } = useToast();
  
  const { data: folders, isLoading, error, refetch } = useQuery({
    queryKey: ['folders', folderId, session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) {
        throw new Error('Authentication required');
      }

      try {
        const query = supabase
          .from("folders")
          .select(`
            *,
            folder_lessons (
              lesson:lessons (
                *,
                episode:episodes (*)
              )
            )
          `)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (folderId) {
          query.eq('id', folderId);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching folders:", error);
          throw error;
        }
        
        return data;
      } catch (error: any) {
        console.error("Error in folders query:", error);
        throw error;
      }
    },
    enabled: !!session?.user?.id && !isLoadingSession,
    retry: 1,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  const handleLessonClick = (episodeId: string) => {
    navigate(`/episode/${episodeId}`);
  };

  const removeLessonFromFolder = async (folderId: string, lessonId: string) => {
    try {
      const { error } = await supabase
        .from('folder_lessons')
        .delete()
        .match({ folder_id: folderId, lesson_id: lessonId });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lesson removed from folder",
      });
      refetch();
    } catch (error: any) {
      console.error("Error removing lesson:", error);
      toast({
        title: "Error",
        description: "Failed to remove lesson from folder",
        variant: "destructive",
      });
    }
  };

  if (error) {
    console.error("Folders fetch error:", error);
    toast({
      title: "Error",
      description: "Failed to load folders. Please try again.",
      variant: "destructive",
    });
  }

  if (isLoadingSession || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 px-4 md:px-0">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold">My University</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Access your organized lessons and study materials
          </p>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {folders?.map((folder) => (
            <Card 
              key={folder.id} 
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg md:text-xl font-semibold truncate">
                  {folder.name}
                </CardTitle>
                <FolderOpen className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {folder.description || 'No description'}
                </p>
                <div className="space-y-2">
                  {folder.folder_lessons?.map((folderLesson: any) => (
                    <div
                      key={folderLesson.lesson.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-secondary transition-colors"
                    >
                      <div
                        onClick={() => handleLessonClick(folderLesson.lesson.episode.id)}
                        className="flex items-center flex-1 cursor-pointer"
                      >
                        <BookOpen className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="text-sm truncate">
                          {folderLesson.lesson.episode.name || 'Untitled Lesson'}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLessonFromFolder(folder.id, folderLesson.lesson.id)}
                        className="ml-2"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  {(!folder.folder_lessons || folder.folder_lessons.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center">No lessons in this folder</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {(!folders || folders.length === 0) && (
            <Card className="col-span-full p-6">
              <p className="text-center text-muted-foreground">
                No folders created yet. Save a lesson to start organizing your university!
              </p>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default UniversityPage;