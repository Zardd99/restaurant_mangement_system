import type { Metadata } from "next";
import "./globals.css";

import localFont from "next/font/local";
import { ReactNode } from "react";
// import Navbar from "./presentation/components/Navbar/Navbar";
import { AuthProvider } from "./contexts/AuthContext";
import { SearchProvider } from "./contexts/SearchContext";
import { SocketProvider } from "./contexts/SocketContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import Layout from "./presentation/components/layout";

const ibmPlexSans = localFont({
  src: [
    { path: "/fonts/IBMPlexSans-Regular.ttf", weight: "400", style: "normal" },
    { path: "/fonts/IBMPlexSans-Medium.ttf", weight: "500", style: "normal" },
    { path: "/fonts/IBMPlexSans-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "/fonts/IBMPlexSans-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--ibm-plex-sans",
});

const bebasNeue = localFont({
  src: [
    { path: "/fonts/BebasNeue-Regular.ttf", weight: "400", style: "normal" },
  ],
  variable: "--bebas-neue",
});

export const metadata: Metadata = {
  title: "Restaurant",
  description:
    "A restaurant software solution for managing orders and reservations",
};

const RootLayout = async ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en">
      <body
        className={`${ibmPlexSans.variable} ${bebasNeue.variable} font-ibm-plex-sans antialiased`}
      >
        <AuthProvider>
          <SocketProvider>
            <WebSocketProvider>
              <SearchProvider>
                <div className="flex flex-col min-h-screen mx-auto">
                  <Layout />
                  <main className="flex-1 ml-[83.40px]">{children}</main>
                </div>
              </SearchProvider>
            </WebSocketProvider>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
};

export default RootLayout;
