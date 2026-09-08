import type { NextConfig } from "next";

// Per-branch backend mapping used only when no explicit API URL is configured.
// Vercel environment variables must take precedence so deployments can select
// a different backend without changing source code.
const API_BY_BRANCH: Record<string, string> = {
  main: "https://backendrestaurant-production-8a7e.up.railway.app",
  staging: "https://backendrestaurant-stagging.up.railway.app",
  dev: "https://backend-restaurant-2.onrender.com",
};

const branch = process.env.VERCEL_GIT_COMMIT_REF;
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (branch && API_BY_BRANCH[branch]) ||
  "http://localhost:5000";

const nextConfig: NextConfig = {
  // Inline the resolved URL so every `process.env.NEXT_PUBLIC_API_URL`
  // consumer (client and server) uses the branch-correct backend.
  env: {
    NEXT_PUBLIC_API_URL: API_URL,
  },

  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: true,
      },
    ];
  },

  // Proxy all /api/* requests from the Next.js dev server (3000) to the
  // Express backend (5000). This covers components that use bare axios with
  // relative paths (e.g. axios.get('/api/tables/...')).
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
