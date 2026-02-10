import React from "react";
import { forwardRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import sidebarContents, { SidebarContent } from "../../../constants/sidebar";

interface SidebarMobileProps {
  handleTog: () => void;
}

const SidebarMobile = forwardRef<HTMLDivElement, SidebarMobileProps>(
  (props, ref) => {
    const { handleTog } = props;
    const pathname = usePathname();
    const sidebarContent: SidebarContent[] = sidebarContents;

    return (
      <div
        className="min-h-screen mt-18 w-20 fixed top-0 left-0 z-50 transition-all duration-300 ease-in-out bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl border-r border-slate-700/50 shadow-2xl"
        ref={ref}
      >

        {/* Navigation */}
        <div className="py-4 space-y-6 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-180px)]">
          {sidebarContent.map((section) => (
            <div key={section.label} className="space-y-2">
              {/* Section indicator */}
              <div className="flex justify-center">
                <div className="w-8 h-[1px] bg-gradient-to-r from-transparent via-slate-500 to-transparent"></div>
              </div>

              <div className="space-y-1 px-2">
                {section.content.map((item) => {
                  const isActive = pathname === item.link;
                  const isExpandable =
                    item.text === "Authentication" || item.text === "Users";

                  return (
                    <div key={item.text} className="relative group">
                      {isExpandable ? (
                        <div
                          className={`flex flex-col items-center p-3 rounded-2xl cursor-pointer transition-all duration-200 hover:bg-slate-700/50 active:scale-95 relative ${
                            isActive
                              ? "bg-gradient-to-b from-blue-500/20 to-purple-500/20"
                              : ""
                          }`}
                          onClick={handleTog}
                        >
                          <div
                            className={`mb-1 transition-all duration-200 ${
                              isActive
                                ? "text-blue-400 scale-110"
                                : "text-slate-400 group-hover:text-white group-hover:scale-105"
                            }`}
                          >
                            {item.icon}
                          </div>
                          <span
                            className={`text-[8px] font-medium text-center leading-tight transition-colors ${
                              isActive
                                ? "text-blue-300"
                                : "text-slate-500 group-hover:text-slate-300"
                            }`}
                          >
                            {item.text}
                          </span>

                          {/* Expand indicator */}
                          <div
                            className={`absolute -right-1 top-1 w-2 h-2 rounded-full transition-all duration-200 ${
                              isExpandable
                                ? "bg-blue-500 opacity-60"
                                : "opacity-0"
                            }`}
                          ></div>
                        </div>
                      ) : (
                        <Link
                          href={item.link}
                          className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-200 hover:bg-slate-700/50 active:scale-95 relative ${
                            isActive
                              ? "bg-gradient-to-b from-blue-500/20 to-purple-500/20"
                              : "hover:bg-slate-700/30"
                          }`}
                        >
                          <div
                            className={`mb-1 transition-all duration-200 ${
                              isActive
                                ? "text-blue-400 scale-110"
                                : "text-slate-400 group-hover:text-white group-hover:scale-105"
                            }`}
                          >
                            {item.icon}
                          </div>
                          <span
                            className={`text-[8px] font-medium text-center leading-tight transition-colors ${
                              isActive
                                ? "text-blue-300"
                                : "text-slate-500 group-hover:text-slate-300"
                            }`}
                          >
                            {item.text}
                          </span>

                          {/* Active indicator */}
                          {isActive && (
                            <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                          )}
                        </Link>
                      )}

                      {/* Hover tooltip */}
                      <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-slate-700 shadow-xl">
                        {item.text}
                        <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Profile section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-700/30 bg-slate-900/80 backdrop-blur">
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105">
              <span className="text-white text-sm font-bold">U</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

SidebarMobile.displayName = "SidebarMobile";

export default SidebarMobile;
