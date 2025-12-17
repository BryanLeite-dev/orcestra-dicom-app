import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { router, protectedProcedure, directorProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { tarefas, tarefasMembros, users, feedEventos, dicoinTransactions } from "../../drizzle/schema";

export const tarefasRouter = router({
  // List all tasks for a sprint
  listBySprint: protectedProcedure
    .input(z.object({ sprintId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const result = await db
        .select()
        .from(tarefas)
        .where(eq(tarefas.sprintId, input.sprintId))
        .orderBy(desc(tarefas.createdAt));
      
      // Get members for each task
      const tasksWithMembers = await Promise.all(
        result.map(async (task) => {
          const members = await db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
              contribuicao: tarefasMembros.contribuicaoPercentual,
            })
            .from(tarefasMembros)
            .leftJoin(users, eq(tarefasMembros.userId, users.id))
            .where(eq(tarefasMembros.tarefaId, task.id));
          
          return { ...task, members };
        })
      );
      
      return tasksWithMembers;
    }),

  // List tasks assigned to current user
  myTasks: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db || !ctx.user) return [];
    
    const assignments = await db
      .select({ tarefaId: tarefasMembros.tarefaId })
      .from(tarefasMembros)
      .where(eq(tarefasMembros.userId, ctx.user.id));
    
    if (assignments.length === 0) return [];
    
    const tarefaIds = assignments.map(a => a.tarefaId);
    const result = await db
      .select()
      .from(tarefas)
      .where(eq(tarefas.id, tarefaIds[0])); // Simplified for now
    
    return result;
  }),

  // Get task by ID with members
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const task = await db
        .select()
        .from(tarefas)
        .where(eq(tarefas.id, input.id))
        .limit(1);
      
      if (!task[0]) return null;
      
      const members = await db
        .select({
          userId: tarefasMembros.userId,
          contribuicao: tarefasMembros.contribuicaoPercentual,
          userName: users.name,
        })
        .from(tarefasMembros)
        .leftJoin(users, eq(tarefasMembros.userId, users.id))
        .where(eq(tarefasMembros.tarefaId, input.id));
      
      return { ...task[0], members };
    }),

  // Create a new task (admin/director only)
  create: directorProcedure
    .input(z.object({
      sprintId: z.number(),
      titulo: z.string().min(1),
      descricao: z.string().optional(),
      coordenadoriaId: z.number().optional(),
      pontosXp: z.number().default(10),
      prazo: z.string().transform(s => new Date(s)).optional(),
      tags: z.array(z.string()).optional(),
      memberIds: z.array(z.number()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user) throw new Error("Database not available");
      
      const { memberIds, ...taskData } = input;
      
      const result = await db.insert(tarefas).values({
        ...taskData,
        createdBy: ctx.user.id,
        status: "todo",
      }).returning();
      
      const taskId = result[0].id;
      
      // Assign members if provided
      if (memberIds && memberIds.length > 0) {
        const contribuicao = Math.floor(100 / memberIds.length);
        await db.insert(tarefasMembros).values(
          memberIds.map(userId => ({
            tarefaId: taskId,
            userId,
            contribuicaoPercentual: contribuicao,
          }))
        );
      }
      
      return { id: taskId, ...taskData };
    }),

  // Update task (admin/director only)
  update: directorProcedure
    .input(z.object({
      id: z.number(),
      titulo: z.string().min(1).optional(),
      descricao: z.string().optional(),
      pontosXp: z.number().optional(),
      prazo: z.string().transform(s => new Date(s)).optional(),
      tags: z.array(z.string()).optional(),
      coordenadoriaId: z.number().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...updateData } = input;
      await db.update(tarefas)
        .set(updateData)
        .where(eq(tarefas.id, id));
      
      return { success: true };
    }),

  // Update task status (move in Kanban)
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["todo", "in_progress", "review", "done", "rejected"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db || !ctx.user) throw new Error("Database not available");
      
      await db.update(tarefas)
        .set({ status: input.status })
        .where(eq(tarefas.id, input.id));
      
      return { success: true };
    }),

  // Approve task (director only)
  approve: directorProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get task details
      const task = await db
        .select()
        .from(tarefas)
        .where(eq(tarefas.id, input.id))
        .limit(1);
      
      if (!task[0]) throw new Error("Task not found");
      
      // Update task status
      await db.update(tarefas)
        .set({ status: "done" })
        .where(eq(tarefas.id, input.id));
      
      // Get assigned members
      const members = await db
        .select()
        .from(tarefasMembros)
        .where(eq(tarefasMembros.tarefaId, input.id));
      
      // Award XP and DiCoins to each member
      for (const member of members) {
        const xpGain = Math.floor(task[0].pontosXp * (member.contribuicaoPercentual / 100));
        const dicoinGain = Math.floor(xpGain * 0.5); // 50% of XP as DiCoins
        
        // Update user stats
        await db.update(users)
          .set({
            xpTotal: sql`${users.xpTotal} + ${xpGain}`,
            xpSprintAtual: sql`${users.xpSprintAtual} + ${xpGain}`,
            dicoinsSaldo: sql`${users.dicoinsSaldo} + ${dicoinGain}`,
            dicoinsTotalGanho: sql`${users.dicoinsTotalGanho} + ${dicoinGain}`,
          })
          .where(eq(users.id, member.userId));
        
        // Log DiCoin transaction
        await db.insert(dicoinTransactions).values({
          userId: member.userId,
          tipo: "ganho",
          valor: dicoinGain,
          motivo: `Tarefa concluída: ${task[0].titulo}`,
          tarefaId: input.id,
        });
        
        // Create feed event
        await db.insert(feedEventos).values({
          userId: member.userId,
          tipo: "tarefa_completa",
          conteudo: {
            titulo: task[0].titulo,
            pontos: xpGain,
          },
        });
        
        // Mark as completed
        await db.update(tarefasMembros)
          .set({ completedAt: new Date() })
          .where(and(
            eq(tarefasMembros.tarefaId, input.id),
            eq(tarefasMembros.userId, member.userId)
          ));
      }
      
      return { success: true };
    }),

  // Reject task (director only)
  reject: directorProcedure
    .input(z.object({
      id: z.number(),
      feedback: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(tarefas)
        .set({
          status: "rejected",
          feedbackRejeicao: input.feedback,
        })
        .where(eq(tarefas.id, input.id));
      
      return { success: true };
    }),

  // Assign members to task
  assignMembers: directorProcedure
    .input(z.object({
      tarefaId: z.number(),
      memberIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Remove existing assignments
      await db.delete(tarefasMembros)
        .where(eq(tarefasMembros.tarefaId, input.tarefaId));
      
      // Add new assignments
      if (input.memberIds.length > 0) {
        const contribuicao = Math.floor(100 / input.memberIds.length);
        await db.insert(tarefasMembros).values(
          input.memberIds.map(userId => ({
            tarefaId: input.tarefaId,
            userId,
            contribuicaoPercentual: contribuicao,
          }))
        );
      }
      
      return { success: true };
    }),

  // Delete task
  delete: directorProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Delete assignments first
      await db.delete(tarefasMembros)
        .where(eq(tarefasMembros.tarefaId, input.id));
      
      // Delete task
      await db.delete(tarefas)
        .where(eq(tarefas.id, input.id));
      
      return { success: true };
    }),
});
