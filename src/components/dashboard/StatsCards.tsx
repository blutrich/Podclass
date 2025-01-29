import { Card } from "@/components/ui/card";
import { BookOpen, Clock, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Folder {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface StatsCardsProps {
  folders: Folder[];
  isLoadingFolders: boolean;
}

export const StatsCards = ({ folders, isLoadingFolders }: StatsCardsProps) => {
  const navigate = useNavigate();

  const handleFolderClick = (folderId: string) => {
    navigate(`/folder/${folderId}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-4 mb-4">
          <BookOpen className="text-secondary" />
          <h3 className="text-lg font-semibold">Available Lessons</h3>
        </div>
        <p className="text-3xl font-bold">3</p>
        <p className="text-gray-600">Free trial lessons remaining</p>
      </Card>

      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-4 mb-4">
          <Clock className="text-secondary" />
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
        <p className="text-gray-600">No lessons completed yet</p>
      </Card>

      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-4 mb-4">
          <FolderOpen className="text-secondary" />
          <h3 className="text-lg font-semibold">My Folders</h3>
        </div>
        {isLoadingFolders ? (
          <p className="text-gray-600">Loading folders...</p>
        ) : folders.length > 0 ? (
          <div className="space-y-2">
            {folders.slice(0, 3).map((folder) => (
              <Button
                key={folder.id}
                variant="ghost"
                className="w-full justify-start text-left"
                onClick={() => handleFolderClick(folder.id)}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                {folder.name}
              </Button>
            ))}
            {folders.length > 3 && (
              <Button
                variant="link"
                className="w-full text-primary"
                onClick={() => navigate('/folders')}
              >
                View all folders ({folders.length})
              </Button>
            )}
          </div>
        ) : (
          <p className="text-gray-600">No folders created yet</p>
        )}
      </Card>
    </div>
  );
};