import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  if (totalPages <= 1) return null;

  return (
    <div className="bg-gray-50 px-4 py-4 border-t border-gray-100">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-700">
          Showing {startIndex + 1} to {endIndex} of {totalItems} results
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (page) =>
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
            )
            .map((page, index, array) => {
              const showEllipsis = index > 0 && page - array[index - 1] > 1;
              return (
                <React.Fragment key={page}>
                  {showEllipsis && (
                    <span className="px-2 text-gray-500">...</span>
                  )}
                  <button
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              );
            })}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
