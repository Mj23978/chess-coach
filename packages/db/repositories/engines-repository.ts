/**
 * Engine repository — CRUD for engine configurations.
 */
import { eq } from "drizzle-orm";
import { db } from "../db";
import { EnginesTable, type Engine, type NewEngine } from "../schema/engines";

export const engineRepository = {
  /** List all configured engines. */
  async list(): Promise<Engine[]> {
    return db.select().from(EnginesTable);
  },

  /** Get the active engine, if any. */
  async getActive(): Promise<Engine | null> {
    const [engine] = await db
      .select()
      .from(EnginesTable)
      .where(eq(EnginesTable.isActive, true))
      .limit(1);
    return engine ?? null;
  },

  /** Get an engine by ID. */
  async getById(id: string): Promise<Engine | null> {
    const [engine] = await db
      .select()
      .from(EnginesTable)
      .where(eq(EnginesTable.id, id))
      .limit(1);
    return engine ?? null;
  },

  /** Create a new engine config. */
  async create(data: NewEngine): Promise<Engine> {
    const [engine] = await db.insert(EnginesTable).values(data).returning();
    return engine!;
  },

  /** Update an engine config. */
  async update(id: string, data: Partial<NewEngine>): Promise<Engine | null> {
    const [engine] = await db
      .update(EnginesTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(EnginesTable.id, id))
      .returning();
    return engine ?? null;
  },

  /** Set an engine as active (deactivates others). */
  async setActive(id: string): Promise<Engine | null> {
    // Deactivate all engines first
    await db.update(EnginesTable).set({ isActive: false });
    // Then activate the requested one
    const [engine] = await db
      .update(EnginesTable)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(EnginesTable.id, id))
      .returning();
    return engine ?? null;
  },

  /** Delete an engine config. */
  async delete(id: string): Promise<void> {
    await db.delete(EnginesTable).where(eq(EnginesTable.id, id));
  },

  /** Update the `exists` flag for an engine. */
  async setExists(id: string, exists: boolean): Promise<void> {
    await db
      .update(EnginesTable)
      .set({ exists, updatedAt: new Date() })
      .where(eq(EnginesTable.id, id));
  },
};
