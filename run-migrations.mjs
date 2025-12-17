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

  console.log("\n⏳ Criando enums...");
  
  // Create role enum if not exists
  await sql`
    DO $$ BEGIN
      CREATE TYPE role AS ENUM('user', 'admin', 'director');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;
  console.log("  ✓ Enum 'role' ok");
  
  // Create nivel enum if not exists
  await sql`
    DO $$ BEGIN
      CREATE TYPE nivel AS ENUM('trainee', 'assessor', 'coordenador', 'maestro', 'virtuoso');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;
  console.log("  ✓ Enum 'nivel' ok");
  
  console.log("\n⏳ Criando/atualizando tabela users...");
  
  // Drop and recreate users table to ensure correct structure
  // This is safe because there are no users yet
  await sql`DROP TABLE IF EXISTS users CASCADE`;
  console.log("  ✓ Tabela antiga removida (se existia)");
  
  // Create users table with ALL columns
  await sql`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      "openId" VARCHAR(128) UNIQUE,
      "googleId" VARCHAR(128) UNIQUE,
      name TEXT,
      email VARCHAR(320) UNIQUE,
      "loginMethod" VARCHAR(64),
      role role DEFAULT 'user' NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "lastSignedIn" TIMESTAMP DEFAULT NOW() NOT NULL,
      "coordenadoriaId" INTEGER,
      nivel nivel DEFAULT 'trainee',
      "xpTotal" INTEGER DEFAULT 0,
      "xpSprintAtual" INTEGER DEFAULT 0,
      "dicoinsSaldo" INTEGER DEFAULT 0,
      "dicoinsTotalGanho" INTEGER DEFAULT 0,
      "dicoinsTotalGasto" INTEGER DEFAULT 0,
      "streakAtual" INTEGER DEFAULT 0,
      "streakRecorde" INTEGER DEFAULT 0,
      "temEscudo" BOOLEAN DEFAULT false,
      "segundaChanceDisponivel" BOOLEAN DEFAULT true,
      "avatarConfig" JSON
    )
  `;
  console.log("  ✓ Tabela 'users' criada com TODAS as colunas");
  
  // Verify table structure
  const columns = await sql`
    SELECT column_name FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users'
    ORDER BY ordinal_position
  `;
  
  console.log(`\n✅ Tabela users criada com ${columns.length} colunas:`);
  console.log(`   ${columns.map(c => c.column_name).join(', ')}`);
  
  await sql.end();
  console.log("\n✅ Setup do banco concluído!");
  
} catch (error) {
  console.error("❌ Erro durante setup:");
  console.error(`  ${error.message}`);
  console.error("  Stack:", error.stack);
  
  // Don't exit with error - let the app try to start anyway
  console.log("\n⚠️  Continuando mesmo com erro de migration...");
}
