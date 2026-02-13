"use client";

// ============================================================================
// Search Context – Global State for Search Query Management
// ============================================================================

import React, { createContext, useContext, useState, ReactNode } from "react";

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Defines the shape of the SearchContext value.
 */
interface SearchContextType {
  /** The current search query string. */
  searchQuery: string;
  /** Function to update the search query. */
  setSearchQuery: (query: string) => void;
}

// ============================================================================
// Context Creation
// ============================================================================

/**
 * SearchContext – React context for sharing search state across components.
 * Initially undefined; will be provided by SearchProvider.
 */
const SearchContext = createContext<SearchContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

/**
 * SearchProvider – Wraps part of the component tree and provides the search context.
 *
 * @param {Object} props - Component props.
 * @param {ReactNode} props.children - Child components that will have access to the search context.
 * @returns {JSX.Element} The provider wrapping the children.
 */
export const SearchProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      {children}
    </SearchContext.Provider>
  );
};

// ============================================================================
// Custom Hook – useSearch
// ============================================================================

/**
 * useSearch – Custom hook to consume the SearchContext.
 *
 * @throws {Error} If used outside of a SearchProvider.
 * @returns {SearchContextType} The search context value.
 */
export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
};
