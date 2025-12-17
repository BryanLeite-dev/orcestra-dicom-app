#!/usr/bin/env node

/**
 * Migration Runner
 * Creates database tables using direct SQL
 */

import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não está definido");
  process.exit(1);
}

console.log("🔄 Iniciando setup do banco de dados...");
console.log(`📍 URL (redacted): ${DATABASE_URL.replace(/:[^@]+@/, ":****@")}`);

try {
  const sql = postgres(DATABASE_URL, { max: 1 });

  console.log("\n⏳ Verificando/criando tabela users...");
  
  // Create role enum if not exists
  await sql`
    DO $$ BEGIN
      CREATE TYPE role AS ENUM('user', 'admin', 'director');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;
  console.log("  ✓ Enum 'role' ok");
  
  // Create users table if not exists
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      "openId" VARCHAR(128) UNIQUE,
      "googleId" VARCHAR(128) UNIQUE,
      name TEXT,
      email VARCHAR(320) UNIQUE,
      "loginMethod" VARCHAR(64),
      role role DEFAULT 'user' NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "lastSignedIn" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
  console.log("  ✓ Tabela 'users' ok");
  
  // Verify table exists
  const tables = await sql`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  `;
  
  if (tables.length > 0) {
    console.log("\n✅ Tabela users verificada e pronta!");
    
    // Count existing users
    const count = await sql`SELECT COUNT(*) as total FROM users`;
    console.log(`   Total de usuários: ${count[0].total}`);
  } else {
    console.log("\n❌ Tabela users NÃO foi criada!");
  }
  
  await sql.end();
  console.log("\n✅ Setup do banco concluído!");
  
} catch (error) {
  console.error("❌ Erro durante setup:");
  console.error(`  ${error.message}`);
  console.error("  Stack:", error.stack);
  
  // Don't exit with error - let the app try to start anyway
  console.log("\n⚠️  Continuando mesmo com erro de migration...");
}
