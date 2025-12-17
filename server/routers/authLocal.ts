import { z } from "zod";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import * as crypto from "crypto";
import jwt from "jsonwebtoken";
import { router, publicProcedure } from "../_core/trpc";

const DIRECTOR_CODE = process.env.DIRECTOR_CODE || "diretor123";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Hash password
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Verify password
function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Generate JWT token
function generateToken(user: any): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export const authLocalRouter = router({
  loginLocal: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Find user by email - select only essential columns to avoid schema mismatch
      const user = await db
        .select({
          id: users.id,
          openId: users.openId,
          email: users.email,
          name: users.name,
          role: users.role,
        })
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (user.length === 0) {
        throw new Error("Email ou senha inválidos");
      }

      const foundUser = user[0];

      // Check if password is stored (for local auth)
      if (!foundUser.openId || !foundUser.openId.startsWith("local_")) {
        throw new Error("Este usuário não foi registrado com email e senha");
      }

      // Verify password
      const passwordHash = foundUser.openId.replace("local_", "");
      if (!verifyPassword(input.password, passwordHash)) {
        throw new Error("Email ou senha inválidos");
      }

      // Generate token
      const token = generateToken(foundUser);

      return {
        success: true,
        token,
        user: {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          role: foundUser.role,
        },
      };
    }),

  registerLocal: publicProcedure
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
        isDirector: z.boolean().default(false),
        directorCode: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if email already exists
      const existingUser = await db
        .select({
          id: users.id,
          email: users.email,
        })
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new Error("Este email já está cadastrado");
      }

      // Verify director code if registering as director
      let role: "user" | "director" = "user";
      if (input.isDirector) {
        if (input.directorCode !== DIRECTOR_CODE) {
          throw new Error("Código de diretor inválido");
        }
        role = "director";
      }

      // Hash password and create openId
      const passwordHash = hashPassword(input.password);
      const openId = `local_${passwordHash}`;

      // Create user - use returning with specific columns to avoid schema mismatch
      const result = await db.insert(users).values({
        openId,
        name: input.name,
        email: input.email,
        role,
        loginMethod: "local",
      }).returning({
        id: users.id,
        openId: users.openId,
        name: users.name,
        email: users.email,
        role: users.role,
      });

      const user = result[0];
      const token = generateToken(user);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }),

  verifyToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      try {
        const decoded = jwt.verify(input.token, JWT_SECRET) as any;
        return {
          valid: true,
          user: decoded,
        };
      } catch (error) {
        return {
          valid: false,
          user: null,
        };
      }
    }),
});
