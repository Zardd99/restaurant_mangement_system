import React from "react";

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  title?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  title = "Something went wrong",
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="mb-6 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-xl transition-colors font-medium"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
