"use client";

import { forwardRef, useEffect, useState } from "react";
import Link from "next/link";
import SidebarMobile from "./SidebarMobile";
import sidebarContents from "../../constants/sidebar";

interface SidebarProps {
  isOpens: boolean;
  handleToggles: () => void;
}

const Sidebar = forwardRef<HTMLDivElement, SidebarProps>((props, ref) => {
  const { isOpens, handleToggles } = props;
  const [isUsersOpen, setIsUsersOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  const handleToggle = (type: "auth" | "users") => {
    if (type === "auth") {
      setIsAuthOpen((prev) => !prev);
    } else if (type === "users") {
      setIsUsersOpen((prev) => !prev);
    }
  };

  // set auth and users dropdown to it initial state when sidebar is closed
  // useEffect to watch for isOpens changes
  // not use useEffect will cause:
  // infinite re-render loop:
  // Calling setIsAuthOpen or setIsUsersOpen triggers a state update, which causes the component to re-render.
  // On every render, the statement runs again, causing another state update, and so on—leading to an infinite loop.
  useEffect(() => {
    if (!isOpens) {
      setIsAuthOpen(false);
      setIsUsersOpen(false);
    }
  }, [isOpens]);

  return (
    <>
      {isOpens ? (
        <div
          className="min-h-screen w-64 fixed top-10 left-0 z-50 transition-transform duration-300 ease-in-out bg-black text-white
          "
          ref={ref}
        >
          {sidebarContents.map((section) => (
            <div
              className="flex flex-col justify-center pt-4"
              key={section.label}
            >
              <div className="mb-6">
                <h2 className="pl-2 font-bebas-neue">{section.label}</h2>
              </div>
              {section.content.map((item) => {
                // Handle dropdowns for Authentication and Users
                if (item.text === "Authentication") {
                  return (
                    <div
                      key={item.text}
                      className="inline-block p-2 rounded-2xl cursor-pointer font-bebas-neue uppercase"
                      onClick={() => handleToggle("auth")}
                      id="auth-menu"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex justify-start items-center">
                          {item.icon}
                          <span className="font-bebas-neue text-left pl-4">
                            {item.text}
                          </span>
                        </div>
                        <div
                          className={`flex items-center justify-center h-full transition-all duration-300 ${
                            isAuthOpen ? "rotate-180" : ""
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            fill="#ffffff"
                            viewBox="0 0 256 256"
                            className="inline-block float-right"
                          >
                            <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                          </svg>
                        </div>
                      </div>
                      {isAuthOpen && (
                        <div className="pl-15 flex flex-col rounded-2xl">
                          <Link
                            href="/login"
                            className="cursor-pointer  px-3 py-1 rounded-xl"
                          >
                            <span className="font-bebas-neue text-left">
                              Login
                            </span>
                          </Link>
                          <Link
                            href="/register"
                            className="cursor-pointer  px-3 py-1 rounded-xl"
                          >
                            <span className="font-bebas-neue text-left">
                              Register
                            </span>
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                }
                if (item.text === "Users") {
                  return (
                    <div
                      key={item.text}
                      className="flex flex-col p-2 rounded-2xl cursor-pointer  font-bebas-neue uppercase"
                      onClick={() => handleToggle("users")}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex justify-start items-center">
                          {item.icon}
                          <span className="font-bebas-neue text-left pl-4">
                            {item.text}
                          </span>
                        </div>
                        <div
                          className={`flex items-center justify-center h-full transition-all duration-300 ${
                            isUsersOpen ? "rotate-180" : ""
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            fill="#ffffff"
                            viewBox="0 0 256 256"
                            className="inline-block float-right"
                          >
                            <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                          </svg>
                        </div>
                      </div>
                      {isUsersOpen && (
                        <div className="pl-15 ">
                          <div className="cursor-pointer  p-1 rounded-xl px-3 py-1">
                            <span className="font-bebas-neue text-left">
                              Profile
                            </span>
                          </div>
                          <div className="cursor-pointer  p-1 rounded-xl px-3 py-1">
                            <span className="font-bebas-neue text-left">
                              Settings
                            </span>
                          </div>
                          <div className="cursor-pointer  p-1 rounded-xl px-3 py-1">
                            <span className="font-bebas-neue text-left">
                              Logout
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                // Default sidebar item
                return (
                  <div
                    key={item.text}
                    className="flex items-center p-2 cursor-pointer  font-bebas-neue uppercase rounded-2xl"
                  >
                    {item.icon}
                    <span className="font-bebas-neue text-left pl-4">
                      {item.text}
                    </span>
                  </div>
                );
              })}
              <div className="flex justify-center mt-1">
                <hr className="w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <SidebarMobile ref={ref} handleTog={handleToggles} />
      )}
    </>
  );
});
Sidebar.displayName = "Sidebar";

export default Sidebar;
