import { defineConfig } from "drizzle-kit";

// Las migraciones van directas a Postgres, no por PgBouncer: `DIRECT_URL` pasa por
// el túnel SSH (`ssh -N -L 5433:127.0.0.1:5432 kit-vps`) o apunta a la base local de QA.
const url = process.env.DIRECT_URL;

if (!url) {
	throw new Error("Falta DIRECT_URL para drizzle-kit.");
}

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/server/db/schema.ts",
	out: "./drizzle",
	dbCredentials: { url },
});
