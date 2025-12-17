#!/usr/bin/env node

/**
 * Database Debug Script
 * Verifica a conexão com o banco de dados e lista as tabelas e colunas
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não está definido no .env');
  process.exit(1);
}

console.log('🔍 Conectando ao banco de dados...');
console.log(`📍 URL (redacted): ${DATABASE_URL.replace(/:[^@]+@/, ':****@')}`);

try {
  const sql = postgres(DATABASE_URL);

  // Test connection
  console.log('\n✅ Conexão bem-sucedida!\n');

  // List all tables
  console.log('📋 Tabelas encontradas:');
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema='public'
    ORDER BY table_name
  `;
  
  tables.forEach(t => console.log(`  - ${t.table_name}`));

  // Check users table structure
  if (tables.some(t => t.table_name === 'users')) {
    console.log('\n🔎 Estrutura da tabela "users":');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='users'
      ORDER BY ordinal_position
    `;
    
    columns.forEach(c => {
      const nullable = c.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
      console.log(`  - ${c.column_name}: ${c.data_type} ${nullable}`);
    });

    // Count users
    console.log('\n👥 Contagem de usuários:');
    const count = await sql`SELECT COUNT(*) as total FROM users`;
    console.log(`  Total: ${count[0].total} usuários`);

    // List users
    if (count[0].total > 0) {
      console.log('\n📜 Usuários no banco:');
      const users = await sql`SELECT id, email, name, role FROM users LIMIT 10`;
      users.forEach(u => {
        console.log(`  - [${u.id}] ${u.email} (${u.name}) - Role: ${u.role}`);
      });
    }
  } else {
    console.log('\n⚠️  Tabela "users" NÃO ENCONTRADA!');
  }

  // Check if migrations need to run
  console.log('\n🔄 Status de migrations:');
  const migrations = await sql`
    SELECT * FROM __drizzle_migrations__ 
    ORDER BY created_at DESC
    LIMIT 5
  `.catch(() => {
    console.log('  ⚠️  Tabela __drizzle_migrations__ não encontrada');
    return [];
  });

  if (migrations.length > 0) {
    console.log(`  Últimas ${Math.min(5, migrations.length)} migrations:`);
    migrations.forEach(m => {
      console.log(`  - ${m.name}`);
    });
  }

  console.log('\n✅ Debug concluído!');
  await sql.end();
} catch (error) {
  console.error('\n❌ Erro ao conectar:');
  console.error(`  ${error.message}`);
  console.error('\n💡 Possíveis causas:');
  console.error('  1. DATABASE_URL incorreta ou expirada');
  console.error('  2. Banco de dados não existe ou foi deletado');
  console.error('  3. Credenciais incorretas');
  console.error('  4. Problemas de conexão de rede/firewall');
  process.exit(1);
}
