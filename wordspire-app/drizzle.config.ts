import { defineConfig } from "drizzle-kit";
import { getEnv } from "./src/lib/config/env";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getEnv().POSTGRES_URL,
  },
  verbose: true,
  strict: true,
});
