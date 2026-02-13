// ============================================================================
// MongoDB Database Connection Utility
// ============================================================================
//
// This module establishes and manages a connection to MongoDB using a singleton
// pattern. It is designed for use in a Next.js application and handles both
// development and production environments appropriately.
//
// In development, a global connection promise is cached to prevent multiple
// connections during hot reloading. In production, a new connection is created
// per request (serverless environment).
//
// ============================================================================

import { MongoClient, Db, Collection } from "mongodb";
import { IUser } from "../types/index";

// ============================================================================
// Environment Variable Validation
// ============================================================================

if (!process.env.MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local",
  );
}

if (!process.env.MONGODB_DB) {
  throw new Error(
    "Please define the MONGODB_DB environment variable inside .env.local",
  );
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

// ============================================================================
// Global Type Declaration (Development Caching)
// ============================================================================

declare global {
  // This declaration allows us to attach a promise to the global object
  // in development mode, preventing multiple connections from being created
  // due to Next.js hot module replacement.
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// ============================================================================
// Client Instance and Promise
// ============================================================================

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// ============================================================================
// Connection Logic – Development vs Production
// ============================================================================

if (process.env.NODE_ENV === "development") {
  // In development, reuse the same client promise across module reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, create a new client for each connection
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

// ============================================================================
// Public Database Access Functions
// ============================================================================

/**
 * Retrieves a connected database instance.
 * The underlying client is reused according to the environment logic above.
 *
 * @returns {Promise<Db>} A promise that resolves to the MongoDB Db object.
 */
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

/**
 * Retrieves the MongoDB collection for user documents.
 * Convenience wrapper around getDatabase().
 *
 * @returns {Promise<Collection<IUser>>} A promise that resolves to the users collection.
 */
export async function getUsersCollection(): Promise<Collection<IUser>> {
  const db = await getDatabase();
  return db.collection<IUser>("users");
}
