import { drizzle } from 'drizzle-orm/mysql2';
import { users } from './drizzle/schema.ts';
import * as crypto from 'crypto';

async function testInsert() {
  try {
    const db = drizzle(process.env.DATABASE_URL);
    
    const passwordHash = crypto.createHash("sha256").update("teste123").digest("hex");
    const openId = `local_${passwordHash}`;
    
    console.log('Attempting to insert user with:');
    console.log({ openId, name: 'Test User', email: 'test@example.com', role: 'user', loginMethod: 'local' });
    
    const result = await db.insert(users).values({
      openId,
      name: 'Test User',
      email: 'test@example.com',
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
    });
    
    console.log('✓ Insert successful!');
    console.log('Result:', result);
  } catch (error) {
    console.error('✗ Insert failed!');
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
  process.exit(0);
}

testInsert();
