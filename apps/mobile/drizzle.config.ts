import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./storage/sqlite/schema.ts",
  out: "./storage/sqlite/drizzle",
  dialect: "sqlite", // 'postgresql' | 'mysql' | 'sqlite'
});
