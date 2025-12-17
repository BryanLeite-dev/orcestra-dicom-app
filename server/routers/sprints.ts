import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, protectedProcedure, directorProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sprints, Sprint, InsertSprint } from "../../drizzle/schema";

export const sprintsRouter = router({
  // List all sprints
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db
      .select()
      .from(sprints)
      .orderBy(desc(sprints.numeroSprint));
    
    return result;
  }),

  // Get current active sprint
  current: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;
    
    const result = await db
      .select()
      .from(sprints)
      .where(eq(sprints.status, "ativa"))
      .limit(1);
    
    return result[0] || null;
  }),

  // Get sprint by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const result = await db
        .select()
        .from(sprints)
        .where(eq(sprints.id, input.id))
        .limit(1);
      
      return result[0] || null;
    }),

  // Create a new sprint (admin/director only)
  create: directorProcedure
    .input(z.object({
      numeroSprint: z.number(),
      dataInicio: z.string().transform(s => new Date(s)),
      dataFim: z.string().transform(s => new Date(s)),
      meta: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const newSprint: InsertSprint = {
        numeroSprint: input.numeroSprint,
        dataInicio: input.dataInicio,
        dataFim: input.dataFim,
        meta: input.meta,
        status: "planejamento",
      };
      
      const result = await db.insert(sprints).values(newSprint).returning();
      return { id: result[0].id, ...newSprint };
    }),

  // Update sprint
  update: directorProcedure
    .input(z.object({
      id: z.number(),
      numeroSprint: z.number().optional(),
      dataInicio: z.string().transform(s => new Date(s)).optional(),
      dataFim: z.string().transform(s => new Date(s)).optional(),
      status: z.enum(["planejamento", "ativa", "concluida"]).optional(),
      meta: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...updateData } = input;
      await db.update(sprints).set(updateData).where(eq(sprints.id, id));
      
      return { success: true };
    }),

  // Activate sprint (deactivate others)
  activate: directorProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // First, set all sprints to planejamento or concluida
      await db.update(sprints)
        .set({ status: "concluida" })
        .where(eq(sprints.status, "ativa"));
      
      // Then activate the selected sprint
      await db.update(sprints)
        .set({ status: "ativa" })
        .where(eq(sprints.id, input.id));
      
      return { success: true };
    }),

  // Delete sprint
  delete: directorProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(sprints).where(eq(sprints.id, input.id));
      
      return { success: true };
    }),
});
