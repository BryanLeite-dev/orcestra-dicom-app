import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure, directorProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { shopItems, userInventory, users, dicoinTransactions, feedEventos } from "../../drizzle/schema";

// Level thresholds
const LEVEL_THRESHOLDS = {
  trainee: 0,
  assessor: 100,
  coordenador: 300,
  maestro: 600,
  virtuoso: 1000,
};

const LEVEL_ORDER = ["trainee", "assessor", "coordenador", "maestro", "virtuoso"] as const;

export const shopRouter = router({
  // List all available items
  list: protectedProcedure
    .input(z.object({
      categoria: z.enum(["roupa", "acessorio", "ferramenta", "pet", "efeito", "edicao_limitada"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      let query = db.select().from(shopItems).where(eq(shopItems.disponivel, true));
      
      const result = await query;
      
      if (input?.categoria) {
        return result.filter(item => item.categoria === input.categoria);
      }
      
      return result;
    }),

  // Get user inventory
  myInventory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db || !ctx.user) return [];
    
    const inventory = await db
      .select({
        inventoryId: userInventory.id,
        itemId: shopItems.id,
        nome: shopItems.nome,
        categoria: shopItems.categoria,
        imagemUrl: shopItems.imagemUrl,
        equipado: userInventory.equipado,
        dataCompra: userInventory.dataCompra,
      })
      .from(userInventory)
      .leftJoin(shopItems, eq(userInventory.itemId, shopItems.id))
      .where(eq(userInventory.userId, ctx.user.id));
    
    return inventory;
  }),

  // Buy an item
  buy: protectedProcedure
    .input(z.object({ itemId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user) throw new Error("Database not available");
      
      // Get item details
      const item = await db
        .select()
        .from(shopItems)
        .where(eq(shopItems.id, input.itemId))
        .limit(1);
      
      if (!item[0]) throw new Error("Item not found");
      if (!item[0].disponivel) throw new Error("Item not available");
      
      // Check if user already owns this item
      const existing = await db
        .select()
        .from(userInventory)
        .where(and(
          eq(userInventory.userId, ctx.user.id),
          eq(userInventory.itemId, input.itemId)
        ))
        .limit(1);
      
      if (existing[0]) throw new Error("You already own this item");
      
      // Check user balance
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);
      
      if (!user[0]) throw new Error("User not found");
      if ((user[0].dicoinsSaldo || 0) < item[0].precoDc) {
        throw new Error("Insufficient DiCoins");
      }
      
      // Check level requirement
      const userLevel = user[0].nivel || "trainee";
      const userLevelIndex = LEVEL_ORDER.indexOf(userLevel as any);
      const requiredLevelIndex = LEVEL_ORDER.indexOf(item[0].requerNivel as any);
      if (userLevelIndex < requiredLevelIndex) {
        throw new Error(`Requires level: ${item[0].requerNivel}`);
      }
      
      // Deduct DiCoins
      await db.update(users)
        .set({
          dicoinsSaldo: sql`${users.dicoinsSaldo} - ${item[0].precoDc}`,
          dicoinsTotalGasto: sql`${users.dicoinsTotalGasto} + ${item[0].precoDc}`,
        })
        .where(eq(users.id, ctx.user.id));
      
      // Add to inventory
      await db.insert(userInventory).values({
        userId: ctx.user.id,
        itemId: input.itemId,
        equipado: false,
      });
      
      // Log transaction
      await db.insert(dicoinTransactions).values({
        userId: ctx.user.id,
        tipo: "gasto",
        valor: item[0].precoDc,
        motivo: `Compra: ${item[0].nome}`,
      });
      
      // Create feed event
      await db.insert(feedEventos).values({
        userId: ctx.user.id,
        tipo: "item_comprado",
        conteudo: {
          itemNome: item[0].nome,
        },
      });
      
      return { success: true, item: item[0] };
    }),

  // Equip/unequip item
  toggleEquip: protectedProcedure
    .input(z.object({ inventoryId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user) throw new Error("Database not available");
      
      // Get inventory item
      const invItem = await db
        .select()
        .from(userInventory)
        .where(and(
          eq(userInventory.id, input.inventoryId),
          eq(userInventory.userId, ctx.user.id)
        ))
        .limit(1);
      
      if (!invItem[0]) throw new Error("Item not found in inventory");
      
      // Toggle equipped status
      await db.update(userInventory)
        .set({ equipado: !invItem[0].equipado })
        .where(eq(userInventory.id, input.inventoryId));
      
      return { success: true, equipped: !invItem[0].equipado };
    }),

  // Admin: Create item
  createItem: directorProcedure
    .input(z.object({
      nome: z.string().min(1),
      descricao: z.string().optional(),
      categoria: z.enum(["roupa", "acessorio", "ferramenta", "pet", "efeito", "edicao_limitada"]),
      precoDc: z.number().min(1),
      raridade: z.enum(["comum", "raro", "epico", "lendario"]).default("comum"),
      requerNivel: z.enum(["trainee", "assessor", "coordenador", "maestro", "virtuoso"]).default("trainee"),
      imagemUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(shopItems).values({
        ...input,
        disponivel: true,
      }).returning();
      
      return { id: result[0].id, ...input };
    }),

  // Admin: Update item
  updateItem: directorProcedure
    .input(z.object({
      id: z.number(),
      nome: z.string().optional(),
      descricao: z.string().optional(),
      precoDc: z.number().optional(),
      disponivel: z.boolean().optional(),
      imagemUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...updateData } = input;
      await db.update(shopItems).set(updateData).where(eq(shopItems.id, id));
      
      return { success: true };
    }),
});
