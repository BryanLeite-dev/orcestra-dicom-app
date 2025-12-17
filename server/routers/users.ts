import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure, directorProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users, coordenadorias } from "../../drizzle/schema";

export const usersRouter = router({
  // List all users (for admin/director)
    list: directorProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        nivel: users.nivel,
        xpTotal: users.xpTotal,
        dicoinsSaldo: users.dicoinsSaldo,
        streakAtual: users.streakAtual,
        coordenadoriaId: users.coordenadoriaId,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .orderBy(desc(users.xpTotal));
    
    return result;
  }),

  // Get user profile by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const user = await db
        .select({
          id: users.id,
          name: users.name,
          nivel: users.nivel,
          xpTotal: users.xpTotal,
          streakAtual: users.streakAtual,
          streakRecorde: users.streakRecorde,
          coordenadoriaId: users.coordenadoriaId,
          avatarConfig: users.avatarConfig,
        })
        .from(users)
        .where(eq(users.id, input.id))
        .limit(1);
      
      if (!user[0]) return null;
      
      // Get coordenadoria name if assigned
      let coordenadoriaNome = null;
      if (user[0].coordenadoriaId) {
        const coord = await db
          .select({ nome: coordenadorias.nome })
          .from(coordenadorias)
          .where(eq(coordenadorias.id, user[0].coordenadoriaId))
          .limit(1);
        coordenadoriaNome = coord[0]?.nome || null;
      }
      
      return { ...user[0], coordenadoriaNome };
    }),

  // Update own profile
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      avatarConfig: z.object({
        skinTone: z.string().optional(),
        hairStyle: z.string().optional(),
        hairColor: z.string().optional(),
        equippedItems: z.array(z.number()).optional(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user) throw new Error("Database not available");
      
      await db.update(users)
        .set(input)
        .where(eq(users.id, ctx.user.id));
      
      return { success: true };
    }),

  // Admin: Update user role
  updateRole: directorProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["user", "admin", "director"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));
      
      return { success: true };
    }),

  // Admin: Assign user to coordenadoria
  assignCoordenadoria: directorProcedure
    .input(z.object({
      userId: z.number(),
      coordenadoriaId: z.number().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(users)
        .set({ coordenadoriaId: input.coordenadoriaId })
        .where(eq(users.id, input.userId));
      
      return { success: true };
    }),

  // Get team members (for regular users)
  teamMembers: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db || !ctx.user) return [];
    
    // Get user's coordenadoria
    const currentUser = await db
      .select({ coordenadoriaId: users.coordenadoriaId })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    
    if (!currentUser[0]?.coordenadoriaId) return [];
    
    // Get team members
    const team = await db
      .select({
        id: users.id,
        name: users.name,
        nivel: users.nivel,
        xpTotal: users.xpTotal,
        streakAtual: users.streakAtual,
      })
      .from(users)
      .where(eq(users.coordenadoriaId, currentUser[0].coordenadoriaId))
      .orderBy(desc(users.xpTotal));
    
    return team;
  }),
});
