import { Skeleton } from "@/components/ui/skeleton";

export const LoadingSkeleton = () => (
  <div className="p-8 w-full max-w-2xl mx-auto space-y-6">
    <div className="space-y-4">
      <Skeleton className="h-12 w-[250px]" />
      <Skeleton className="h-4 w-[300px]" />
    </div>
    <div className="space-y-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-24 w-full" />
          <div className="flex space-x-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-[150px]" />
          </div>
        </div>
      ))}
    </div>
  </div>
);