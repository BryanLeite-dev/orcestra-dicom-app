#!/usr/bin/env node
/**
 * Seed Users Script
 * Creates test users in the database for development/testing
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

console.log('📍 Connecting to:', DATABASE_URL.replace(/:[^@]+@/, ':****@'));

const client = postgres(DATABASE_URL);
const db = drizzle(client);

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Import schema dynamically
async function importSchema() {
  try {
    // Use a JSON schema definition instead of importing TS file
    return {
      users: {
        id: 'id',
        openId: 'openId',
        name: 'name',
        email: 'email',
        role: 'role',
        loginMethod: 'loginMethod',
      }
    };
  } catch (e) {
    console.error('Failed to import schema:', e.message);
    process.exit(1);
  }
}

async function createTestUsers() {
  console.log('🌱 Starting user seeding...\n');
  
  try {
    // Create Hugo test user (main test user)
    const hugoPassword = hashPassword('123456789');
    const hugoOpenId = `local_${hugoPassword}`;
    
    const hugoValues = {
      openId: hugoOpenId,
      name: 'Hugo Nemet',
      email: 'hugo.nemet@orcestra.com.br',
      role: 'user',
      loginMethod: 'local',
      nivel: 'trainee',
      xpTotal: 0,
      xpSprintAtual: 0,
      dicoinsSaldo: 0,
      dicoinsTotalGanho: 0,
      dicoinsTotalGasto: 0,
      streakAtual: 0,
      streakRecorde: 0,
      temEscudo: false,
      segundaChanceDisponivel: true,
    };
    
    console.log('📝 Creating Hugo user...');
    try {
      // Use raw SQL insert with all columns
      const result = await client`
        INSERT INTO users (
          "openId", "name", "email", "role", "loginMethod"
        ) VALUES (
          ${hugoOpenId}, 'Hugo Nemet', 'hugo.nemet@orcestra.com.br', 'user', 'local'
        )
        ON CONFLICT DO NOTHING
        RETURNING id, email
      `;
      
      if (result.length > 0) {
        console.log('✅ Hugo user created successfully');
        console.log(`   Email: hugo.nemet@orcestra.com.br`);
        console.log(`   Password: 123456789`);
      } else {
        console.log('ℹ️  Hugo user already exists');
      }
    } catch (e) {
      console.error('❌ Error creating Hugo user:', e.message);
    }

    // Create diretor user
    console.log('\n📝 Creating Diretor test user...');
    try {
      const diretorPassword = hashPassword('senha123');
      const diretorOpenId = `local_${diretorPassword}`;
      
      const result = await client`
        INSERT INTO users (
          "openId", "name", "email", "role", "loginMethod"
        ) VALUES (
          ${diretorOpenId}, 'Diretor Teste', 'diretor@test.com', 'director', 'local'
        )
        ON CONFLICT DO NOTHING
        RETURNING id, email
      `;
      
      if (result.length > 0) {
        console.log('✅ Diretor user created successfully');
        console.log(`   Email: diretor@test.com`);
        console.log(`   Password: senha123`);
      } else {
        console.log('ℹ️  Diretor user already exists');
      }
    } catch (e) {
      console.error('❌ Error creating Diretor user:', e.message);
    }

    // Create membro user
    console.log('\n📝 Creating Membro test user...');
    try {
      const membroPassword = hashPassword('senha123');
      const membroOpenId = `local_${membroPassword}`;
      
      const result = await client`
        INSERT INTO users (
          "openId", "name", "email", "role", "loginMethod"
        ) VALUES (
          ${membroOpenId}, 'Membro Teste', 'membro@test.com', 'user', 'local'
        )
        ON CONFLICT DO NOTHING
        RETURNING id, email
      `;
      
      if (result.length > 0) {
        console.log('✅ Membro user created successfully');
        console.log(`   Email: membro@test.com`);
        console.log(`   Password: senha123`);
      } else {
        console.log('ℹ️  Membro user already exists');
      }
    } catch (e) {
      console.error('❌ Error creating Membro user:', e.message);
    }

    // Verify users were created
    console.log('\n🔍 Verifying users in database...');
    const users = await client`SELECT id, email, role FROM users ORDER BY id DESC LIMIT 5`;
    
    if (users.length > 0) {
      console.log(`\n✅ Found ${users.length} user(s) in database:`);
      users.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.email} (${u.role})`);
      });
    } else {
      console.log('\n⚠️  No users found in database');
    }

    console.log('\n✅ Seeding complete!');
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    await client.end();
    process.exit(1);
  }
}

createTestUsers();
