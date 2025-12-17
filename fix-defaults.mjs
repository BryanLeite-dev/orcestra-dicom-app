import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';

async function fixDefaults() {
  try {
    const db = drizzle(process.env.DATABASE_URL);
    
    // Alter table to set proper defaults
    const queries = [
      `ALTER TABLE users MODIFY COLUMN xpTotal INT NOT NULL DEFAULT 0`,
      `ALTER TABLE users MODIFY COLUMN xpSprintAtual INT NOT NULL DEFAULT 0`,
      `ALTER TABLE users MODIFY COLUMN dicoinsSaldo INT NOT NULL DEFAULT 0`,
      `ALTER TABLE users MODIFY COLUMN dicoinsTotalGanho INT NOT NULL DEFAULT 0`,
      `ALTER TABLE users MODIFY COLUMN dicoinsTotalGasto INT NOT NULL DEFAULT 0`,
      `ALTER TABLE users MODIFY COLUMN streakAtual INT NOT NULL DEFAULT 0`,
      `ALTER TABLE users MODIFY COLUMN streakRecorde INT NOT NULL DEFAULT 0`,
      `ALTER TABLE users MODIFY COLUMN temEscudo TINYINT NOT NULL DEFAULT 0`,
      `ALTER TABLE users MODIFY COLUMN segundaChanceDisponivel TINYINT NOT NULL DEFAULT 1`,
    ];
    
    for (const query of queries) {
      console.log(`Executing: ${query}`);
      await db.execute(sql.raw(query));
    }
    
    console.log('✓ All defaults fixed!');
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

fixDefaults();
