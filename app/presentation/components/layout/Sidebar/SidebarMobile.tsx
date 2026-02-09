import { usePathname } from "next/navigation";
import { SidebarSection } from "./types";
import { SidebarConfig } from "../../../../lib/sidebar/sidebarConfig";

interface SidebarMobileProps {
  userRole: string;
  onItemClick?: (itemId: string) => void;
  onExpand?: () => void;
}

const SidebarMobile = ({
  userRole,
  onItemClick,
  onExpand,
}: SidebarMobileProps) => {
  const pathname = usePathname();
  const mobileItems = SidebarConfig.getMobileSidebarItems(userRole);

  return (
    <div className="fixed inset-y-0 left-0 z-40 w-16 bg-black border-r border-gray-800 ">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-800">
        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-sm">RP</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-2 space-y-2">
        {mobileItems.map((item) => {
          const isActive = item.link === pathname;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (onItemClick) onItemClick(item.id);
                if (onExpand && item.children?.length) onExpand();
              }}
              className={`w-full p-2 rounded-lg transition-colors relative group ${
                isActive
                  ? "bg-gray-700 bg-opacity-40 text-white shadow-lg"
                  : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
              }`}
              title={item.text}
            >
              <div className="flex flex-col items-center">
                <div className="relative">
                  {item.icon}
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-[8px] flex items-center justify-center text-white">
                      {typeof item.badge === "number" && item.badge > 9
                        ? "9+"
                        : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-medium text-center leading-tight mt-1 truncate max-w-full">
                  {item.text}
                </span>
              </div>

              {/* Tooltip */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-gray-700 shadow-xl">
                {item.text}
                {item.isNew && (
                  <span className="ml-1 px-1 bg-green-500/30 text-green-300 text-[10px] rounded">
                    NEW
                  </span>
                )}
                <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
              </div>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l shadow-lg" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-800">
        <button className="w-10 h-10 mx-auto bg-gray-700 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg relative">
          <span className="text-white font-bold text-sm">U</span>
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-gray-900"></div>
        </button>
      </div>
    </div>
  );
};

export default SidebarMobile;
