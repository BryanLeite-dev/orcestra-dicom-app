import { describe, it, expect } from "vitest";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import * as crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

describe("Auth Local - User Creation", () => {
  it("should verify test user exists", async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const membroPassword = hashPassword("senha123");
    const membroOpenId = `local_${membroPassword}`;

    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, "membro@test.com"))
      .limit(1);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].email).toBe("membro@test.com");
    expect(result[0].role).toBe("user");
    console.log("✓ Test user exists and is correctly configured");
  });

  it("should verify director user exists", async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, "diretor@test.com"))
      .limit(1);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].email).toBe("diretor@test.com");
    expect(result[0].role).toBe("director");
    console.log("✓ Director user exists and is correctly configured");
  });
});
