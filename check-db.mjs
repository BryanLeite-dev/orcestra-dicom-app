import postgres from "postgres";

const DATABASE_URL = "postgresql://postgres:TuXkzSzHObGhvYoXnamINEJKaoscyPWD@hopper.proxy.rlwy.net:17702/railway";

async function checkDatabase() {
  try {
    console.log("[DEBUG] Connecting to database...");
    const sql = postgres(DATABASE_URL);
    
    console.log("[DEBUG] Connection established!");
    
    // List all tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log("\n✅ TABLES IN DATABASE:");
    console.log("========================");
    tables.forEach(t => console.log(`  - ${t.table_name}`));
    console.log("========================\n");
    
    // Check if users table exists and has data
    if (tables.some(t => t.table_name === 'users')) {
      const userCount = await sql`SELECT COUNT(*) as count FROM users;`;
      console.log(`✅ Users table found with ${userCount[0].count} records`);
      
      // Show schema
      const schema = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `;
      console.log("\n✅ USERS TABLE SCHEMA:");
      schema.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`));
    } else {
      console.log("❌ Users table NOT FOUND!");
    }
    
    await sql.end();
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    process.exit(1);
  }
}

checkDatabase();
