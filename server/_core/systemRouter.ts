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

      // Check if users table exists - db.execute returns array directly in Drizzle
      const tablesResult: any = await db.execute(sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      // Handle both formats: array directly or { rows: [] }
      const tablesData = Array.isArray(tablesResult) ? tablesResult : (tablesResult.rows || []);
      const tables = tablesData.map((r: any) => r.table_name);

      // Check users table columns
      let userColumns: string[] = [];
      if (tables.includes('users')) {
        const columnsResult: any = await db.execute(sql`
          SELECT column_name FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'users'
          ORDER BY ordinal_position
        `);
        const columnsData = Array.isArray(columnsResult) ? columnsResult : (columnsResult.rows || []);
        userColumns = columnsData.map((r: any) => r.column_name);
      }

      // Check enums
      const enumsResult: any = await db.execute(sql`
        SELECT typname, enumlabel 
        FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid
        ORDER BY typname, enumsortorder
      `);
      const enumsData = Array.isArray(enumsResult) ? enumsResult : (enumsResult.rows || []);
      const enums: Record<string, string[]> = {};
      for (const row of enumsData) {
        if (!enums[row.typname]) enums[row.typname] = [];
        enums[row.typname].push(row.enumlabel);
      }

      // Count users
      let userCount = 0;
      if (tables.includes('users')) {
        const countResult: any = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
        const countData = Array.isArray(countResult) ? countResult : (countResult.rows || []);
        userCount = Number(countData[0]?.count || 0);
      }

      return {
        connected: true,
        tables,
        usersTableExists: tables.includes('users'),
        userColumns,
        userColumnCount: userColumns.length,
        enums,
        userCount,
        debug: {
          tablesResultType: typeof tablesResult,
          isArray: Array.isArray(tablesResult),
        }
      };
    } catch (error: any) {
      return {
        connected: false,
        error: error.message,
        code: error.code,
        stack: error.stack?.split('\n').slice(0, 5),
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
