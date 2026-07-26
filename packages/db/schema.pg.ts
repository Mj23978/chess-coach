/**
 * Schema barrel — re-export every table so `drizzle(pglite, { schema })` and
 * the type `typeof schema` in db.ts see them all. Add new schema files here.
 */
export * from "./schema/games";
export * from "./schema/engines";
export * from "./schema/accounts";
export * from "./schema/databases";
