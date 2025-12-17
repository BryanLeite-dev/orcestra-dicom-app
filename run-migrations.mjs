#!/usr/bin/env node

/**
 * Migration Runner
 * Executa as migrations no banco de dados
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não está definido");
  process.exit(1);
}

console.log("🔄 Iniciando migrations...");
console.log(`📍 URL (redacted): ${DATABASE_URL.replace(/:[^@]+@/, ":****@")}`);

try {
  const client = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  console.log("\n⏳ Executando migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  
  console.log("✅ Migrations concluídas com sucesso!");
  
  await client.end();
} catch (error) {
  console.error("❌ Erro durante migrations:");
  console.error(`  ${error.message}`);
  
  if (error.message.includes("ECONNREFUSED")) {
    console.error("\n💡 Erro de conexão - banco pode estar inacessível");
  }
  
  process.exit(1);
}
