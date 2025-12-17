import { drizzle } from 'drizzle-orm/mysql2';
import { users } from './drizzle/schema.ts';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

async function checkUsers() {
  try {
    const allUsers = await db.select().from(users);
    console.log('Total users:', allUsers.length);
    allUsers.forEach(u => {
      console.log(`- ${u.email} (${u.role})`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
