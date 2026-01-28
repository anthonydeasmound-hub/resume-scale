export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-gray-200 rounded animate-pulse ${className}`}
    />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <SkeletonLine className="h-4 w-1/3 mb-4" />
      <SkeletonLine className="h-3 w-full mb-2" />
      <SkeletonLine className="h-3 w-2/3 mb-2" />
      <SkeletonLine className="h-3 w-4/5" />
    </div>
  );
}

export function PageSkeleton({ title = true }: { title?: boolean }) {
  return (
    <div className="space-y-6">
      {title && <SkeletonLine className="h-8 w-48" />}
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div>
      {/* Promo banner skeleton */}
      <div className="bg-gray-900 rounded-xl p-5 mb-8">
        <SkeletonLine className="h-5 w-64 bg-gray-700" />
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Resume preview skeleton */}
        <div className="w-full md:w-[400px] md:shrink-0">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 border-b">
              <SkeletonLine className="h-4 w-28" />
            </div>
            <div className="p-4" style={{ height: "528px" }}>
              <SkeletonLine className="h-6 w-48 mb-4" />
              <SkeletonLine className="h-3 w-32 mb-6" />
              <SkeletonLine className="h-3 w-full mb-2" />
              <SkeletonLine className="h-3 w-full mb-2" />
              <SkeletonLine className="h-3 w-3/4 mb-6" />
              <SkeletonLine className="h-4 w-40 mb-3" />
              <SkeletonLine className="h-3 w-full mb-2" />
              <SkeletonLine className="h-3 w-full mb-2" />
              <SkeletonLine className="h-3 w-5/6" />
            </div>
          </div>
        </div>

        {/* Right column skeleton */}
        <div className="flex-1 min-w-0">
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}

export function AppliedSkeleton() {
  return (
    <div>
      {/* Calendar skeleton */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="text-center p-2">
              <SkeletonLine className="h-3 w-8 mx-auto mb-1" />
              <SkeletonLine className="h-4 w-6 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-4">
        <SkeletonLine className="h-6 w-40" />
        <SkeletonLine className="h-9 w-64 rounded-lg" />
      </div>

      {/* Job rows skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-4 flex items-center gap-4">
            <SkeletonLine className="h-10 w-10 rounded-lg" />
            <div className="flex-1">
              <SkeletonLine className="h-4 w-48 mb-2" />
              <SkeletonLine className="h-3 w-32" />
            </div>
            <SkeletonLine className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MasterResumeSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <SkeletonLine className="h-7 w-48 mb-2" />
          <SkeletonLine className="h-4 w-72" />
        </div>
        <SkeletonLine className="h-10 w-32 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form skeleton */}
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        {/* Preview skeleton */}
        <div className="bg-white rounded-xl shadow-lg p-4" style={{ height: "600px" }}>
          <SkeletonLine className="h-6 w-48 mb-4" />
          <SkeletonLine className="h-3 w-full mb-2" />
          <SkeletonLine className="h-3 w-full mb-2" />
          <SkeletonLine className="h-3 w-3/4" />
        </div>
      </div>
    </div>
  );
}

export function ToolsSkeleton() {
  return (
    <div>
      <SkeletonLine className="h-8 w-32 mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-6 flex flex-col items-center">
            <SkeletonLine className="h-10 w-10 rounded-lg mb-3" />
            <SkeletonLine className="h-4 w-24 mb-1" />
            <SkeletonLine className="h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReviewSkeleton() {
  return (
    <div>
      <SkeletonLine className="h-8 w-48 mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-lg p-5 flex items-center gap-4">
            <SkeletonLine className="h-12 w-12 rounded-lg" />
            <div className="flex-1">
              <SkeletonLine className="h-4 w-56 mb-2" />
              <SkeletonLine className="h-3 w-36" />
            </div>
            <SkeletonLine className="h-8 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function JobDetailSkeleton() {
  return (
    <div>
      {/* Back button + header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <SkeletonLine className="h-5 w-40" />
        <SkeletonLine className="h-9 w-24 rounded-lg" />
      </div>

      {/* Job info card */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <SkeletonLine className="h-6 w-64 mb-2" />
        <SkeletonLine className="h-4 w-40 mb-4" />
        <div className="flex gap-3">
          <SkeletonLine className="h-6 w-20 rounded-full" />
          <SkeletonLine className="h-6 w-24 rounded-full" />
        </div>
      </div>

      {/* Stage progress skeleton */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <SkeletonLine className="h-5 w-40 mb-4" />
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1 flex items-center gap-2">
              <SkeletonLine className="h-8 w-8 rounded-full" />
              <SkeletonLine className="h-1 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ExtensionSkeleton() {
  return (
    <div>
      <SkeletonLine className="h-8 w-48 mb-2" />
      <SkeletonLine className="h-4 w-72 mb-8" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-lg p-6">
            <SkeletonLine className="h-14 w-14 rounded-xl mb-4" />
            <SkeletonLine className="h-5 w-32 mb-2" />
            <SkeletonLine className="h-3 w-full" />
          </div>
        ))}
      </div>

      <SkeletonCard className="p-8" />
    </div>
  );
}
