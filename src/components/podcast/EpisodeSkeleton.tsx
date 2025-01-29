import { Skeleton } from "@/components/ui/skeleton";

export const EpisodeSkeleton = () => {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex space-x-3">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>
  );
};