import { migrate } from "./db/migrate";

// Run migrations on startup
migrate().catch(console.error);

// Export all API routes
export * from "./multisigs.post";
