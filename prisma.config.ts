// Try to load dotenv if available (dev environment)
// In production (Amplify), env vars are already set via SSM
try {
  require("dotenv/config");
} catch (e) {
  // dotenv not available in production, that's fine
}

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
