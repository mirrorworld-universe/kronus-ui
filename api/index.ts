import { runMigrations } from "./db/migrate";

// Run migrations on startup
runMigrations().catch(console.error);

// Export all API routes
export * from "./multisigs.post";
