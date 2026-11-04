import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

/**
 * Conexión de la app, siempre por PgBouncer en modo transacción: sin estado de
 * sesión entre consultas (`SET`, advisory locks, `LISTEN`). Las migraciones no pasan
 * por aquí, van directas con `DIRECT_URL` (`drizzle.config.ts`).
 *
 * Pool corto porque cada instancia de función abre el suyo: quien reparte de verdad
 * las conexiones es PgBouncer.
 */
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	max: 3,
	idleTimeoutMillis: 10_000,
	connectionTimeoutMillis: 5_000,
});

// Una conexión inactiva que muere (reinicio de Postgres o PgBouncer) emite aquí: sin
// manejador, tumbaría el proceso con las peticiones en curso. El pool abre otra.
pool.on("error", (error) => {
	console.error("Idle database connection failed:", error.message);
});

export const db = drizzle(pool, { schema });
