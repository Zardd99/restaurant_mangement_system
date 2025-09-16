"use client";
import Sidebar from "../Sidebar/Sidebar";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSearch } from "../../contexts/SearchContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { searchQuery, setSearchQuery } = useSearch(); // Use the context
  const sidebarRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleToggle = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
    // The search query is now available globally through context
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        !hamburgerRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <nav className="fixed w-full z-[9999] bg-black">
        <div className="p-4 border-b border-slate-700/30 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div
              className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center z-[999] cursor-pointer"
              onClick={toggleMenu}
              ref={hamburgerRef}
            >
              <svg
                className="w-6 h-6 text-white z-[999]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                  />
                </svg>
              </div>
              <input
                type="text"
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full p-2 pl-10 text-sm rounded-lg bg-gray-700 border border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search menu items..."
              />
            </form>
          </div>
        </div>
        <Sidebar
          isOpens={isOpen}
          handleToggles={handleToggle}
          ref={sidebarRef}
        />
      </nav>
    </>
  );
};

export default Navbar;
