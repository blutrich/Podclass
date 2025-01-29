import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateEpisodeForm } from "./CreateEpisodeForm";
import { useState } from "react";

interface CreateEpisodeDialogProps {
  podcastId: string;
  onSuccess?: () => void;
}

export function CreateEpisodeDialog({ podcastId, onSuccess }: CreateEpisodeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    setIsOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Episode</DialogTitle>
          <DialogDescription>
            Add a new episode to your podcast. Fill in the episode details below.
          </DialogDescription>
        </DialogHeader>
        <CreateEpisodeForm podcastId={podcastId} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}