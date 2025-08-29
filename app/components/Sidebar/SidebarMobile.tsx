import React from "react";
import { forwardRef } from "react";
import sidebarContents, { SidebarContent } from "../../constants/sidebar";

interface SidebarMobileProps {
  handleTog: () => void;
}

const SidebarMobile = forwardRef<HTMLDivElement, SidebarMobileProps>(
  (props, ref) => {
    const { handleTog } = props;

    const sidebarContent: SidebarContent[] = sidebarContents;

    return (
      <div
        className={`min-h-screen w-fit fixed top-10 left-0 z-50 transition-transform duration-300 ease-in-out bg-black text-white`}
        ref={ref}
      >
        {/* Home */}
        {sidebarContent.map((con) => (
          <div className="flex flex-col justify-center pt-4" key={con.label}>
            <div className="mb-6">
              <h2 className="pl-2 font-bebas-neue">{con.label}</h2>
            </div>
            {con.content.map((cons) => (
              <div
                className="flex flex-col items-center p-2 cursor-pointer  font-bebas-neue uppercase rounded-2xl"
                key={cons.text}
                onClick={
                  cons.text === "Authentication" || "Users"
                    ? () => handleTog()
                    : undefined
                }
              >
                <>
                  {cons.icon}
                  <span className="font-ibm-plex-sans block text-[8px]">
                    {cons.text}
                  </span>
                </>
              </div>
            ))}
            <div className="flex justify-center mt-1">
              <hr
                className="w-full
              "
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
);
SidebarMobile.displayName = "SidebarMobile";

export default SidebarMobile;
