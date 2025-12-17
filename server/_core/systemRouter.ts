import { z } from "zod";
import { sql } from "drizzle-orm";
import { notifyOwner } from "./notification";
import { adminProcedure, directorProcedure, publicProcedure, router } from "./trpc";
import { getDb } from "../db";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  // Debug endpoint to check database status
  dbStatus: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) {
        return { connected: false, error: "Database not available" };
      }

      // Check if users table exists
      const tablesResult = await db.execute(sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      const tables = tablesResult.rows.map((r: any) => r.table_name);

      // Check users table columns
      let userColumns: string[] = [];
      if (tables.includes('users')) {
        const columnsResult = await db.execute(sql`
          SELECT column_name FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'users'
          ORDER BY ordinal_position
        `);
        userColumns = columnsResult.rows.map((r: any) => r.column_name);
      }

      // Check enums
      const enumsResult = await db.execute(sql`
        SELECT typname, enumlabel 
        FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid
        ORDER BY typname, enumsortorder
      `);
      const enums: Record<string, string[]> = {};
      for (const row of enumsResult.rows as any[]) {
        if (!enums[row.typname]) enums[row.typname] = [];
        enums[row.typname].push(row.enumlabel);
      }

      // Count users
      let userCount = 0;
      if (tables.includes('users')) {
        const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
        userCount = Number((countResult.rows[0] as any).count);
      }

      return {
        connected: true,
        tables,
        usersTableExists: tables.includes('users'),
        userColumns,
        userColumnCount: userColumns.length,
        enums,
        userCount,
      };
    } catch (error: any) {
      return {
        connected: false,
        error: error.message,
        code: error.code,
      };
    }
  }),

  notifyOwner: directorProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
