import React from "react";

interface LoadingStateProps {
  type: "orders" | "menu";
  count?: number;
}

const LoadingState: React.FC<LoadingStateProps> = ({ type, count = 6 }) => {
  if (type === "orders") {
    return (
      <div className="space-y-6">
        <div className="flex space-x-4 mb-6">
          {["all", "confirmed", "preparing", "ready"].map((status) => (
            <div
              key={status}
              className="h-10 bg-gray-200 rounded-full px-4 py-2 w-24 animate-pulse"
            ></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(count)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
            >
              <div className="h-6 bg-gray-200 rounded-full w-1/2 mb-4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded-full w-1/4 mb-6 animate-pulse"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div
                    key={j}
                    className="h-4 bg-gray-200 rounded-full animate-pulse"
                  ></div>
                ))}
              </div>
              <div className="h-10 bg-gray-200 rounded-xl mt-6 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Menu loading state
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(count)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100"
            >
              <div className="h-40 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
              <div className="p-4">
                <div className="h-6 bg-gray-200 rounded-full w-3/4 mb-3 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded-full w-1/4 mb-3 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded-xl animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <div className="h-8 bg-gray-200 rounded-full w-1/2 mb-6 animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-200 rounded-xl animate-pulse"
            ></div>
          ))}
        </div>
        <div className="h-12 bg-gray-200 rounded-xl mt-8 animate-pulse"></div>
      </div>
    </div>
  );
};

export default LoadingState;
