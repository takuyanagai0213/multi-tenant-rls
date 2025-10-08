import { Kysely, PostgresDialect } from "kysely";
import postgres from "postgres";
import type { DB } from "./types";

export const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    postgres: postgres(process.env.DATABASE_URL!),
  }),
});
