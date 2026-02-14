import { config } from "dotenv";
config({ path: ".env.local" });
import "@testing-library/jest-dom";

process.env.NEXT_PUBLIC_API_URL = "http://localhost:5000";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    entries: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    forEach: jest.fn(),
  }),
  usePathname: () => "",
}));
