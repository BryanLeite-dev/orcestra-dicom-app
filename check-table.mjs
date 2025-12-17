import { drizzle } from 'drizzle-orm/mysql2';
import { users } from './drizzle/schema.ts';
import { sql } from 'drizzle-orm';

async function checkTable() {
  try {
    const db = drizzle(process.env.DATABASE_URL);
    const result = await db.execute(sql.raw('DESCRIBE users'));
    console.log('Table structure:');
    console.log(result);
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

checkTable();
