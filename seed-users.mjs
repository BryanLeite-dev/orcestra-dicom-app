import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from './drizzle/schema.ts';
import * as crypto from 'crypto';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost/orcestra';

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client);

if (!DATABASE_URL) {
  console.log('Using default DATABASE_URL');
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function createTestUsers() {
  console.log('Starting user creation...');
  console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  try {
    // Create membro user
    const membroPassword = hashPassword('senha123');
    const membroOpenId = `local_${membroPassword}`;
    console.log('Membro OpenID:', membroOpenId);

    // Create diretor user
    const diretorPassword = hashPassword('senha123');
    const diretorOpenId = `local_${diretorPassword}`;

    const membroValues = {
      openId: membroOpenId,
      name: 'Membro Teste',
      email: 'membro@test.com',
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
  } catch (e) {
    console.error('Error creating membro user:', e.message);
  }

  try {
    const diretorPassword = hashPassword('senha123');
    const diretorOpenId = `local_${diretorPassword}`;
    console.log('Diretor OpenID:', diretorOpenId);

    const diretorValues = {
      openId: diretorOpenId,
      name: 'Diretor Teste',
      email: 'diretor@test.com',
      role: 'director',
      loginMethod: 'local',
      nivel: 'virtuoso',
      xpTotal: 1000,
      xpSprintAtual: 100,
      dicoinsSaldo: 500,
      dicoinsTotalGanho: 1000,
      dicoinsTotalGasto: 500,
      streakAtual: 5,
      streakRecorde: 10,
      temEscudo: true,
      segundaChanceDisponivel: true,
    };
    
    console.log('Inserting diretor user...');
    try {
      await db.insert(users).values(diretorValues);
      console.log('✓ Diretor user created (diretor@test.com / senha123)');
    } catch (e) {
      if (e.code === '23505') {
        console.log('User already exists, skipping...');
      } else {
        throw e;
      }
    }
  } catch (e) {
    console.error('Error creating diretor user:', e.message);
  }

  console.log('\nTest users ready!');
  await client.end();
  process.exit(0);
}

createTestUsers().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
