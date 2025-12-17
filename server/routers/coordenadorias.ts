import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure, directorProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { coordenadorias, users } from "../../drizzle/schema";

export const coordenadoriasRouter = router({
  // List all coordenadorias
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db
      .select()
      .from(coordenadorias)
      .orderBy(coordenadorias.nome);
    
    return result;
  }),

  // Get coordenadoria by ID with members
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const coord = await db
        .select()
        .from(coordenadorias)
        .where(eq(coordenadorias.id, input.id))
        .limit(1);
      
      if (!coord[0]) return null;
      
      const members = await db
        .select({
          id: users.id,
          name: users.name,
          nivel: users.nivel,
          xpTotal: users.xpTotal,
          streakAtual: users.streakAtual,
        })
        .from(users)
        .where(eq(users.coordenadoriaId, input.id))
        .orderBy(desc(users.xpTotal));
      
      return { ...coord[0], members };
    }),

  // Create coordenadoria (admin only)
  create: directorProcedure
    .input(z.object({
      nome: z.string().min(1),
      descricao: z.string().optional(),
      icone: z.string().optional(),
      corTema: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(coordenadorias).values(input).returning();
      return { id: result[0].id, ...input };
    }),

  // Update coordenadoria
  update: directorProcedure
    .input(z.object({
      id: z.number(),
      nome: z.string().optional(),
      descricao: z.string().optional(),
      icone: z.string().optional(),
      corTema: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...updateData } = input;
      await db.update(coordenadorias).set(updateData).where(eq(coordenadorias.id, id));
      
      return { success: true };
    }),

  // Assign user to coordenadoria
  assignUser: directorProcedure
    .input(z.object({
      userId: z.number(),
      coordenadoriaId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(users)
        .set({ coordenadoriaId: input.coordenadoriaId })
        .where(eq(users.id, input.userId));
      
      return { success: true };
    }),

  // Delete coordenadoria
  delete: directorProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Remove users from this coordenadoria first
      await db.update(users)
        .set({ coordenadoriaId: null })
        .where(eq(users.coordenadoriaId, input.id));
      
      await db.delete(coordenadorias).where(eq(coordenadorias.id, input.id));
      
      return { success: true };
    }),
});
