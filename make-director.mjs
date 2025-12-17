import "dotenv/config";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não está definida!");
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function makeDirector() {
  try {
    console.log("🔄 Conectando ao banco de dados...");
    
    // Primeiro, encontrar o usuário pelo email
    const user = await sql`
      SELECT id, email, role, nivel FROM users 
      WHERE email = 'bryan.leite@orcestra.com.br'
      LIMIT 1
    `;

    if (user.length === 0) {
      console.log("❌ Usuário com email 'bryan.leite@orcestra.com.br' não encontrado");
      console.log("📋 Usuários no banco:");
      const allUsers = await sql`SELECT id, email, role FROM users`;
      console.table(allUsers);
      process.exit(1);
    }

    const userId = user[0].id;
    console.log(`📧 Usuário encontrado: ${user[0].email} (ID: ${userId})`);
    
    // Atualizar para diretor
    const result = await sql`
      UPDATE users 
      SET role = 'director', nivel = 'virtuoso'
      WHERE id = ${userId}
      RETURNING id, email, role, nivel
    `;

    console.log("✅ Usuário atualizado com sucesso!");
    console.log("📋 Detalhes:", result[0]);
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

makeDirector();

