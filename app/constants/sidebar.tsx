// ============================================================================
// External Dependencies
// ============================================================================
import React from "react";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Represents a single navigation item inside a sidebar group.
 */
export interface SidebarItem {
  /** React node (usually an SVG icon) displayed to the left of the text. */
  icon: React.ReactNode;
  /** Display label for the navigation link. */
  text: string;
  /** URL or path the link points to. Use "#" for dropdown placeholders. */
  link: string;
}

/**
 * Represents a group of navigation items with a common label.
 */
export interface SidebarContent {
  /** Heading text for the group (e.g., "Home", "Page"). */
  label: string;
  /** Array of navigation items belonging to this group. */
  content: SidebarItem[];
}

// ============================================================================
// Sidebar Navigation Structure
// ============================================================================

/**
 * Defines the complete sidebar navigation menu.
 * Each top‑level entry is a group with a label and a list of navigation items.
 *
 * @constant
 */
const sidebarContents: SidebarContent[] = [
  // --------------------------------------------------------------------------
  // Group: Home
  // --------------------------------------------------------------------------
  {
    label: "Home",
    content: [
      {
        // Dashboard icon – 4‑square grid (dashboard overview)
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            fill="#ffffff"
            viewBox="0 0 256 256"
            className="inline-block"
          >
            <path d="M104,40H56A16,16,0,0,0,40,56v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,104,40Zm0,64H56V56h48v48Zm96-64H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,200,40Zm0,64H152V56h48v48Zm-96,32H56a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,104,136Zm0,64H56V152h48v48Zm96-64H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,200,136Zm0,64H152V152h48v48Z"></path>
          </svg>
        ),
        text: "Dashboard",
        link: "/dashboard",
      },
    ],
  },

  // --------------------------------------------------------------------------
  // Group: Page
  // --------------------------------------------------------------------------
  {
    label: "Page",
    content: [
      {
        // Special / UI components icon – window with four panes
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            fill="#ffffff"
            viewBox="0 0 256 256"
            className="inline-block"
          >
            <path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm-12.69,88L136,60.69V48h12.69L208,107.32V120ZM120,48v72H48V48ZM107.31,208,48,148.69V136H60.69L120,195.31V208ZM208,208H136V136h72v72Z"></path>
          </svg>
        ),
        text: "Special",
        link: "/user_interface",
      },
      {
        // Authentication icon – shield with checkmark (security)
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            fill="#ffffff"
            viewBox="0 0 256 256"
            className="inline-block"
          >
            <path d="M208,40H48A16,16,0,0,0,32,56v56c0,52.72,25.52,84.67,46.93,102.19,23.06,18.86,46,25.26,47,25.53a8,8,0,0,0,4.2,0c1-.27,23.91-6.67,47-25.53C198.48,196.67,224,164.72,224,112V56A16,16,0,0,0,208,40Zm0,72c0,37.07-13.66,67.16-40.6,89.42A129.3,129.3,0,0,1,128,223.62a128.25,128.25,0,0,1-38.92-21.81C61.82,179.51,48,149.3,48,112l0-56,160,0ZM82.34,141.66a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32l-56,56a8,8,0,0,1-11.32,0Z"></path>
          </svg>
        ),
        text: "Authentication",
        link: "#", // Placeholder – actual route may be nested in a dropdown
      },
      {
        // Users icon – single person silhouette (user management)
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            fill="#ffffff"
            viewBox="0 0 256 256"
            className="inline-block"
          >
            <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>
          </svg>
        ),
        text: "Users",
        link: "#", // Placeholder – likely a parent for nested routes
      },
      {
        // Chef / Kitchen icon – cooking pot with steam
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            fill="#ffffff"
            viewBox="0 0 256 256"
          >
            <path d="M240,112a56.06,56.06,0,0,0-56-56c-1.77,0-3.54.1-5.29.26a56,56,0,0,0-101.42,0C75.54,56.1,73.77,56,72,56A56,56,0,0,0,48,162.59V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V162.59A56.09,56.09,0,0,0,240,112Zm-48,96H64V167.42a55.49,55.49,0,0,0,8,.58H184a55.49,55.49,0,0,0,8-.58Zm-8-56H170.25l5.51-22.06a8,8,0,0,0-15.52-3.88L153.75,152H136V128a8,8,0,0,0-16,0v24H102.25l-6.49-25.94a8,8,0,1,0-15.52,3.88L85.75,152H72a40,40,0,0,1,0-80l.58,0A55.21,55.21,0,0,0,72,80a8,8,0,0,0,16,0,40,40,0,0,1,80,0,8,8,0,0,0,16,0,55.21,55.21,0,0,0-.58-8l.58,0a40,40,0,0,1,0,80Z"></path>
          </svg>
        ),
        text: "Chef",
        link: "/waiter_order",
      },
    ],
  },
];

// ============================================================================
// Export
// ============================================================================
export default sidebarContents;
