import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure, directorProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  conquistas, 
  userConquistas, 
  feedEventos, 
  feedReactions, 
  users,
  dicoinTransactions 
} from "../../drizzle/schema";

// Level thresholds and names
const LEVELS = [
  { name: "trainee", minXp: 0, maxXp: 99, title: "Trainee Orc" },
  { name: "assessor", minXp: 100, maxXp: 299, title: "Assessor Orc" },
  { name: "coordenador", minXp: 300, maxXp: 599, title: "Coordenador Orc" },
  { name: "maestro", minXp: 600, maxXp: 999, title: "Maestro Orc" },
  { name: "virtuoso", minXp: 1000, maxXp: Infinity, title: "Virtuoso Orc" },
] as const;

export const gamificationRouter = router({
  // Get user stats
  myStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db || !ctx.user) return null;
    
    const user = await db
      .select({
        id: users.id,
        name: users.name,
        nivel: users.nivel,
        xpTotal: users.xpTotal,
        xpSprintAtual: users.xpSprintAtual,
        dicoinsSaldo: users.dicoinsSaldo,
        dicoinsTotalGanho: users.dicoinsTotalGanho,
        dicoinsTotalGasto: users.dicoinsTotalGasto,
        streakAtual: users.streakAtual,
        streakRecorde: users.streakRecorde,
        temEscudo: users.temEscudo,
        segundaChanceDisponivel: users.segundaChanceDisponivel,
        avatarConfig: users.avatarConfig,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    
    if (!user[0]) return null;
    
    // Calculate level progress
    const userLevel = user[0].nivel || "trainee";
    const currentLevel = LEVELS.find(l => l.name === userLevel) || LEVELS[0];
    const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];
    
    const xpInLevel = (user[0].xpTotal || 0) - currentLevel.minXp;
    const xpForNextLevel = nextLevel ? nextLevel.minXp - currentLevel.minXp : 0;
    const progress = nextLevel ? Math.min(100, (xpInLevel / xpForNextLevel) * 100) : 100;
    
    return {
      ...user[0],
      levelTitle: currentLevel.title,
      nextLevelTitle: nextLevel?.title || null,
      xpProgress: progress,
      xpToNextLevel: nextLevel ? nextLevel.minXp - (user[0].xpTotal || 0) : 0,
    };
  }),

  // Get all conquistas
  listConquistas: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    return await db.select().from(conquistas);
  }),

  // Get user's unlocked conquistas
  myConquistas: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db || !ctx.user) return [];
    
    const result = await db
      .select({
        id: conquistas.id,
        nome: conquistas.nome,
        descricao: conquistas.descricao,
        categoria: conquistas.categoria,
        raridade: conquistas.raridade,
        iconeUrl: conquistas.iconeUrl,
        dataDesbloqueio: userConquistas.dataDesbloqueio,
      })
      .from(userConquistas)
      .leftJoin(conquistas, eq(userConquistas.conquistaId, conquistas.id))
      .where(eq(userConquistas.userId, ctx.user.id))
      .orderBy(desc(userConquistas.dataDesbloqueio));
    
    return result;
  }),

  // Get feed events
  feed: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const limit = input?.limit || 20;
      const offset = input?.offset || 0;
      
      const events = await db
        .select({
          id: feedEventos.id,
          userId: feedEventos.userId,
          userName: users.name,
          tipo: feedEventos.tipo,
          conteudo: feedEventos.conteudo,
          timestamp: feedEventos.timestamp,
        })
        .from(feedEventos)
        .leftJoin(users, eq(feedEventos.userId, users.id))
        .orderBy(desc(feedEventos.timestamp))
        .limit(limit)
        .offset(offset);
      
      // Get reactions for each event
      const eventsWithReactions = await Promise.all(
        events.map(async (event) => {
          const reactions = await db
            .select({
              emoji: feedReactions.emoji,
              count: sql<number>`COUNT(*)`,
            })
            .from(feedReactions)
            .where(eq(feedReactions.eventoId, event.id))
            .groupBy(feedReactions.emoji);
          
          return { ...event, reactions };
        })
      );
      
      return eventsWithReactions;
    }),

  // Add reaction to feed event
  addReaction: protectedProcedure
    .input(z.object({
      eventoId: z.number(),
      emoji: z.string().max(10),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user) throw new Error("Database not available");
      
      // Check if user already reacted with this emoji
      const existing = await db
        .select()
        .from(feedReactions)
      .where(eq(feedReactions.eventoId, input.eventoId));
      
      if (existing.find(r => r.userId === ctx.user!.id && r.emoji === input.emoji)) {
        // Remove reaction
        await db.delete(feedReactions)
          .where(eq(feedReactions.id, existing[0].id));
        return { success: true, action: "removed" };
      }
      
      // Add reaction
      await db.insert(feedReactions).values({
        eventoId: input.eventoId,
        userId: ctx.user.id,
        emoji: input.emoji,
      });
      
      return { success: true, action: "added" };
    }),

  // Get DiCoin transaction history
  myTransactions: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db || !ctx.user) return [];
      
      return await db
        .select()
        .from(dicoinTransactions)
        .where(eq(dicoinTransactions.userId, ctx.user.id))
        .orderBy(desc(dicoinTransactions.timestamp))
        .limit(input?.limit || 20);
    }),

  // Buy protection shield
  buyShield: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db || !ctx.user) throw new Error("Database not available");
    
    const SHIELD_COST = 500;
    
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    
    if (!user[0]) throw new Error("User not found");
    if (user[0].temEscudo) throw new Error("You already have a shield");
    if ((user[0].dicoinsSaldo || 0) < SHIELD_COST) throw new Error("Insufficient DiCoins");
    
    await db.update(users)
      .set({
        temEscudo: true,
        dicoinsSaldo: sql`${users.dicoinsSaldo} - ${SHIELD_COST}`,
        dicoinsTotalGasto: sql`${users.dicoinsTotalGasto} + ${SHIELD_COST}`,
      })
      .where(eq(users.id, ctx.user.id));
    
    await db.insert(dicoinTransactions).values({
      userId: ctx.user.id,
      tipo: "gasto",
      valor: SHIELD_COST,
      motivo: "Compra: Escudo de Proteção",
    });
    
    return { success: true };
  }),

  // Use second chance
  useSecondChance: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db || !ctx.user) throw new Error("Database not available");
    
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    
    if (!user[0]) throw new Error("User not found");
    if (!user[0].segundaChanceDisponivel) throw new Error("Second chance already used this month");
    
    await db.update(users)
      .set({ segundaChanceDisponivel: false })
      .where(eq(users.id, ctx.user.id));
    
    return { success: true };
  }),

  // Admin: Create conquista
  createConquista: directorProcedure
    .input(z.object({
      nome: z.string().min(1),
      descricao: z.string().optional(),
      categoria: z.enum(["valor", "comunicacao", "estruturacao"]),
      raridade: z.enum(["bronze", "prata", "ouro"]).default("bronze"),
      iconeUrl: z.string().optional(),
      recompensaDicoins: z.number().default(10),
      criterio: z.object({
        tipo: z.string(),
        quantidade: z.number().optional(),
        condicao: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(conquistas).values(input).returning();
      return { id: result[0].id, ...input };
    }),

  // Admin: Award conquista to user
  awardConquista: directorProcedure
    .input(z.object({
      userId: z.number(),
      conquistaId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get conquista details
      const conquista = await db
        .select()
        .from(conquistas)
        .where(eq(conquistas.id, input.conquistaId))
        .limit(1);
      
      if (!conquista[0]) throw new Error("Conquista not found");
      
      // Check if already awarded
      const existing = await db
        .select()
        .from(userConquistas)
        .where(eq(userConquistas.userId, input.userId))
        .limit(1);
      
      if (existing.find(c => c.conquistaId === input.conquistaId)) {
        throw new Error("User already has this conquista");
      }
      
      // Award conquista
      await db.insert(userConquistas).values({
        userId: input.userId,
        conquistaId: input.conquistaId,
      });
      
      // Award DiCoins
      await db.update(users)
        .set({
          dicoinsSaldo: sql`${users.dicoinsSaldo} + ${conquista[0].recompensaDicoins}`,
          dicoinsTotalGanho: sql`${users.dicoinsTotalGanho} + ${conquista[0].recompensaDicoins}`,
        })
        .where(eq(users.id, input.userId));
      
      // Log transaction
      await db.insert(dicoinTransactions).values({
        userId: input.userId,
        tipo: "ganho",
        valor: conquista[0].recompensaDicoins,
        motivo: `Conquista: ${conquista[0].nome}`,
      });
      
      // Create feed event
      await db.insert(feedEventos).values({
        userId: input.userId,
        tipo: "conquista",
        conteudo: {
          conquistaNome: conquista[0].nome,
        },
      });
      
      return { success: true };
    }),

  // Get leaderboard
  leaderboard: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    return await db
      .select({
        id: users.id,
        name: users.name,
        nivel: users.nivel,
        xpTotal: users.xpTotal,
        streakAtual: users.streakAtual,
      })
      .from(users)
      .orderBy(desc(users.xpTotal))
      .limit(20);
  }),
});
