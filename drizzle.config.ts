import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// bun run no le pasa los .env a drizzle-kit. `DIRECT_URL` gana si ya viene puesta (la de QA).
if (!process.env.DIRECT_URL && existsSync(".env.development.local")) {
	process.loadEnvFile(".env.development.local");
}

// Las migraciones van directas a Postgres, no por PgBouncer: `DIRECT_URL` pasa por el túnel
// SSH (`ssh -N -L 5433:127.0.0.1:5432 kit-vps`) o apunta a la base local de QA. Sin throw:
// db:generate no necesita base y debe funcionar en un clon limpio.
export default defineConfig({
	dialect: "postgresql",
	schema: "./src/server/db/schema.ts",
	out: "./drizzle",
	dbCredentials: { url: process.env.DIRECT_URL ?? "" },
});
