import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';

async function fixOpenId() {
  try {
    const db = drizzle(process.env.DATABASE_URL);
    
    console.log('Altering openId column to varchar(128)...');
    await db.execute(sql.raw(`ALTER TABLE users MODIFY COLUMN openId VARCHAR(128) NOT NULL`));
    await db.execute(sql.raw(`ALTER TABLE users ADD UNIQUE KEY unique_openId (openId)`));
    
    console.log('✓ openId column fixed!');
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
  process.exit(0);
}

fixOpenId();
