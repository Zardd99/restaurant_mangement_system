/**
 * DashboardSkeleton – server-rendered placeholder streamed by route-level
 * `loading.tsx` Suspense boundaries.
 *
 * Because it carries no `"use client"` directive and no data dependencies, it is
 * emitted with the initial server response: the persistent shell (root layout +
 * sidebar) stays on screen and this skeleton streams in immediately while the
 * client page component hydrates and fetches, instead of showing a blank frame.
 */
const DashboardSkeleton = ({ title }: { title?: string }) => {
  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          {title ? (
            <h1 className="text-2xl md:text-3xl font-bold text-gray-300">
              {title}
            </h1>
          ) : (
            <div className="h-8 w-64 bg-gray-200 rounded mb-4 animate-pulse" />
          )}
          <div className="h-4 w-96 max-w-full bg-gray-200 rounded animate-pulse mt-3" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse"
            >
              <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
              <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded mb-6" />
          <div className="h-64 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
