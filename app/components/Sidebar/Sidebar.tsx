"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
type SidebarProps = {
  isOpens: boolean;
};

const Sidebar = ({ isOpens }: SidebarProps) => {
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const toggleSidebarComponentUsers = () => {
    setIsUsersOpen(!isUsersOpen);
  };

  const toggleSidebarAuth = () => {
    setIsAuthOpen(!isAuthOpen);
  };

  return (
    <>
      {isOpens && (
        <div
          className={`min-h-screen w-64 fixed top-10 left-0 ${
            isOpens ? "translate-x-1" : "-translate-x-full"
          } bg-white shadow-lg z-50 transition-transform duration-300 ease-in-out`}
        >
          <div className="p-4 flex justify-center items-center">
            <Image src="/logo.png" alt="Logo" height={50.92} width={157.76} />
          </div>
          {/* Home */}
          <div className="flex flex-col justify-center pt-4">
            <div className="mb-6">
              <h2 className="pl-2 font-bebas-neue">Home</h2>
            </div>
            <div className="inline-block p-2 cursor-pointer hover:bg-gray-200 font-bebas-neue uppercase rounded-2xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                fill="#000000"
                viewBox="0 0 256 256"
                className="inline-block"
              >
                <path d="M104,40H56A16,16,0,0,0,40,56v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,104,40Zm0,64H56V56h48v48Zm96-64H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,200,40Zm0,64H152V56h48v48Zm-96,32H56a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,104,136Zm0,64H56V152h48v48Zm96-64H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,200,136Zm0,64H152V152h48v48Z"></path>
              </svg>
              <span className="font-bebas-neue text-left pl-4">Dashboard</span>
            </div>
          </div>
          <div className="flex justify-center mt-1">
            <hr
              className="w-full
          "
            />
          </div>
          {/* Page */}
          <div className="flex flex-col justify-center pt-4">
            <div className="mb-6">
              <h2 className="pl-2 font-bebas-neue">Page</h2>
            </div>
            {/* Page/Special Pages */}
            <div className="inline-block p-2 cursor-pointer hover:bg-gray-200 font-bebas-neue uppercase rounded-2xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                fill="#000000"
                viewBox="0 0 256 256"
                className="inline-block"
              >
                <path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm-12.69,88L136,60.69V48h12.69L208,107.32V120ZM136,83.31,172.69,120H136Zm72,1.38L171.31,48H208ZM120,48v72H48V48ZM107.31,208,48,148.69V136H60.69L120,195.31V208ZM120,172.69,83.31,136H120Zm-72-1.38L84.69,208H48ZM208,208H136V136h72v72Z"></path>
              </svg>
              <span className="font-bebas-neue text-left pl-4">
                Special Pages
              </span>
            </div>
            {/* Page/Auth */}
            <div
              className="inline-block p-2 rounded-2xl cursor-pointer hover:bg-gray-200 font-bebas-neue uppercase"
              onClick={toggleSidebarAuth}
              id="auth-menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                fill="#000000"
                viewBox="0 0 256 256"
                className="inline-block"
              >
                <path d="M208,40H48A16,16,0,0,0,32,56v56c0,52.72,25.52,84.67,46.93,102.19,23.06,18.86,46,25.26,47,25.53a8,8,0,0,0,4.2,0c1-.27,23.91-6.67,47-25.53C198.48,196.67,224,164.72,224,112V56A16,16,0,0,0,208,40Zm0,72c0,37.07-13.66,67.16-40.6,89.42A129.3,129.3,0,0,1,128,223.62a128.25,128.25,0,0,1-38.92-21.81C61.82,179.51,48,149.3,48,112l0-56,160,0ZM82.34,141.66a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32l-56,56a8,8,0,0,1-11.32,0Z"></path>
              </svg>
              <span className="font-bebas-neue text-left pl-4">Auth</span>
              {isAuthOpen && (
                <div className="pl-15 flex flex-col rounded-2xl">
                  <Link
                    href="/login"
                    className="cursor-pointer hover:bg-gray-300 px-3 py-1 rounded-xl"
                  >
                    <span className="font-bebas-neue text-left">Login</span>
                  </Link>
                  <Link
                    href="/register"
                    className="cursor-pointer hover:bg-gray-300 px-3 py-1 rounded-xl"
                  >
                    <span className="font-bebas-neue text-left">Register</span>
                  </Link>
                </div>
              )}
            </div>
            {/* Page/USER */}
            <div
              className="inline-block p-2 rounded-2xl cursor-pointer hover:bg-gray-200 font-bebas-neue uppercase"
              onClick={toggleSidebarComponentUsers}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                fill="#000000"
                viewBox="0 0 256 256"
                className="inline-block"
              >
                <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>
              </svg>
              <span className="font-bebas-neue text-left pl-4">Users</span>
              {isUsersOpen && (
                <div className="pl-15 ">
                  <div className="cursor-pointer hover:bg-gray-300 p-1 rounded-xl px-3 py-1">
                    <span className="font-bebas-neue text-left">Profile</span>
                  </div>
                  <div className="cursor-pointer hover:bg-gray-300 p-1 rounded-xl px-3 py-1">
                    <span className="font-bebas-neue text-left">Settings</span>
                  </div>
                  <div className="cursor-pointer hover:bg-gray-300 p-1 rounded-xl px-3 py-1">
                    <span className="font-bebas-neue text-left">Logout</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-center mt-1">
            <hr className="w-full" />
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
