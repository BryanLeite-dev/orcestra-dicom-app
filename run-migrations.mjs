#!/usr/bin/env node

/**
 * Migration Runner
 * Creates database tables using direct SQL
 */

import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL não está definido");
  process.exit(1);
}

console.log("🔄 Iniciando setup do banco de dados...");
console.log(`📍 URL (redacted): ${DATABASE_URL.replace(/:[^@]+@/, ":****@")}`);

try {
  const sql = postgres(DATABASE_URL, { max: 1 });

  console.log("\n⏳ Criando enums...");
  
  // Create role enum if not exists
  await sql`
    DO $$ BEGIN
      CREATE TYPE role AS ENUM('user', 'admin', 'director');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;
  console.log("  ✓ Enum 'role' ok");
  
  // Create nivel enum if not exists
  await sql`
    DO $$ BEGIN
      CREATE TYPE nivel AS ENUM('trainee', 'assessor', 'coordenador', 'maestro', 'virtuoso');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;
  console.log("  ✓ Enum 'nivel' ok");
  
  console.log("\n⏳ Criando/atualizando tabela users...");
  
  // Check if table exists
  const tableExists = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    )
  `;
  
  if (!tableExists[0].exists) {
    // Create users table with ALL columns
    await sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        "openId" VARCHAR(128) UNIQUE,
        "googleId" VARCHAR(128) UNIQUE,
        name TEXT,
        email VARCHAR(320) UNIQUE,
        "loginMethod" VARCHAR(64),
        role role DEFAULT 'user' NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
        "lastSignedIn" TIMESTAMP DEFAULT NOW() NOT NULL,
        "coordenadoriaId" INTEGER,
        nivel nivel DEFAULT 'trainee',
        "xpTotal" INTEGER DEFAULT 0,
        "xpSprintAtual" INTEGER DEFAULT 0,
        "dicoinsSaldo" INTEGER DEFAULT 0,
        "dicoinsTotalGanho" INTEGER DEFAULT 0,
        "dicoinsTotalGasto" INTEGER DEFAULT 0,
        "streakAtual" INTEGER DEFAULT 0,
        "streakRecorde" INTEGER DEFAULT 0,
        "temEscudo" BOOLEAN DEFAULT false,
        "segundaChanceDisponivel" BOOLEAN DEFAULT true,
        "avatarConfig" JSON
      )
    `;
    console.log("  ✓ Tabela 'users' criada com TODAS as colunas");
  } else {
    // Table exists - add missing columns
    console.log("  ✓ Tabela 'users' já existe, verificando colunas...");
    
    const addColumnIfNotExists = async (columnName, columnDef) => {
      const exists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'users' AND column_name = ${columnName}
        )
      `;
      if (!exists[0].exists) {
        await sql.unsafe(`ALTER TABLE users ADD COLUMN "${columnName}" ${columnDef}`);
        console.log(`    + Adicionada coluna '${columnName}'`);
      }
    };
    
    await addColumnIfNotExists('coordenadoriaId', 'INTEGER');
    await addColumnIfNotExists('nivel', "nivel DEFAULT 'trainee'");
    await addColumnIfNotExists('xpTotal', 'INTEGER DEFAULT 0');
    await addColumnIfNotExists('xpSprintAtual', 'INTEGER DEFAULT 0');
    await addColumnIfNotExists('dicoinsSaldo', 'INTEGER DEFAULT 0');
    await addColumnIfNotExists('dicoinsTotalGanho', 'INTEGER DEFAULT 0');
    await addColumnIfNotExists('dicoinsTotalGasto', 'INTEGER DEFAULT 0');
    await addColumnIfNotExists('streakAtual', 'INTEGER DEFAULT 0');
    await addColumnIfNotExists('streakRecorde', 'INTEGER DEFAULT 0');
    await addColumnIfNotExists('temEscudo', 'BOOLEAN DEFAULT false');
    await addColumnIfNotExists('segundaChanceDisponivel', 'BOOLEAN DEFAULT true');
    await addColumnIfNotExists('avatarConfig', 'JSON');
    
    console.log("  ✓ Colunas verificadas/adicionadas");
  }
  
  // Verify table structure
  const columns = await sql`
    SELECT column_name FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users'
    ORDER BY ordinal_position
  `;
  
  console.log(`\n✅ Tabela users criada com ${columns.length} colunas:`);
  console.log(`   ${columns.map(c => c.column_name).join(', ')}`);
  
  // Create other enums
  console.log("\n⏳ Criando outros enums...");
  
  const createEnumIfNotExists = async (name, values) => {
    await sql.unsafe(`
      DO $$ BEGIN
        CREATE TYPE ${name} AS ENUM(${values.map(v => `'${v}'`).join(', ')});
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log(`  ✓ Enum '${name}' ok`);
  };
  
  await createEnumIfNotExists('sprint_status', ['planejamento', 'ativa', 'concluida']);
  await createEnumIfNotExists('tarefa_status', ['todo', 'in_progress', 'review', 'done', 'rejected']);
  await createEnumIfNotExists('conquista_categoria', ['valor', 'comunicacao', 'estruturacao']);
  await createEnumIfNotExists('conquista_raridade', ['bronze', 'prata', 'ouro']);
  await createEnumIfNotExists('shop_item_categoria', ['roupa', 'acessorio', 'ferramenta', 'pet', 'efeito', 'edicao_limitada']);
  await createEnumIfNotExists('shop_item_raridade', ['comum', 'raro', 'epico', 'lendario']);
  await createEnumIfNotExists('dicoin_tipo', ['ganho', 'gasto', 'perda']);
  await createEnumIfNotExists('feed_evento_tipo', ['tarefa_completa', 'nivel_subiu', 'conquista', 'meta_coletiva', 'item_comprado']);
  await createEnumIfNotExists('lead_status', ['prospecto', 'qualificado', 'proposta', 'cliente', 'perdido']);
  await createEnumIfNotExists('canal_origem', ['google_ads', 'linkedin', 'instagram', 'ebook', 'organico_linkedin', 'referral', 'direto']);
  await createEnumIfNotExists('tipo_campanha', ['google_ads', 'linkedin', 'email', 'ebook', 'evento', 'organico']);
  
  // Create other tables
  console.log("\n⏳ Criando outras tabelas...");
  
  const createTableIfNotExists = async (name, createSQL) => {
    const exists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = ${name}
      )
    `;
    if (!exists[0].exists) {
      await sql.unsafe(createSQL);
      console.log(`  ✓ Tabela '${name}' criada`);
    } else {
      console.log(`  ✓ Tabela '${name}' já existe`);
    }
  };
  
  // coordenadorias
  await createTableIfNotExists('coordenadorias', `
    CREATE TABLE coordenadorias (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL UNIQUE,
      descricao TEXT,
      icone VARCHAR(50),
      "corTema" VARCHAR(7),
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  // sprints
  await createTableIfNotExists('sprints', `
    CREATE TABLE sprints (
      id SERIAL PRIMARY KEY,
      "numeroSprint" INTEGER NOT NULL,
      "dataInicio" TIMESTAMP NOT NULL,
      "dataFim" TIMESTAMP NOT NULL,
      status sprint_status DEFAULT 'planejamento' NOT NULL,
      meta TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  // tarefas
  await createTableIfNotExists('tarefas', `
    CREATE TABLE tarefas (
      id SERIAL PRIMARY KEY,
      "sprintId" INTEGER NOT NULL,
      titulo VARCHAR(255) NOT NULL,
      descricao TEXT,
      "coordenadoriaId" INTEGER,
      "pontosXp" INTEGER DEFAULT 10 NOT NULL,
      prazo TIMESTAMP,
      status tarefa_status DEFAULT 'todo' NOT NULL,
      "createdBy" INTEGER NOT NULL,
      "feedbackRejeicao" TEXT,
      tags JSON,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  // tarefas_membros
  await createTableIfNotExists('tarefas_membros', `
    CREATE TABLE tarefas_membros (
      id SERIAL PRIMARY KEY,
      "tarefaId" INTEGER NOT NULL,
      "userId" INTEGER NOT NULL,
      "contribuicaoPercentual" INTEGER DEFAULT 100 NOT NULL,
      "completedAt" TIMESTAMP
    )
  `);
  
  // conquistas
  await createTableIfNotExists('conquistas', `
    CREATE TABLE conquistas (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      descricao TEXT,
      categoria conquista_categoria NOT NULL,
      raridade conquista_raridade DEFAULT 'bronze' NOT NULL,
      "iconeUrl" VARCHAR(500),
      criterio JSON,
      "recompensaDicoins" INTEGER DEFAULT 10 NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  // user_conquistas
  await createTableIfNotExists('user_conquistas', `
    CREATE TABLE user_conquistas (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL,
      "conquistaId" INTEGER NOT NULL,
      "dataDesbloqueio" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  // shop_items
  await createTableIfNotExists('shop_items', `
    CREATE TABLE shop_items (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      descricao TEXT,
      categoria shop_item_categoria NOT NULL,
      "precoDc" INTEGER NOT NULL,
      raridade shop_item_raridade DEFAULT 'comum' NOT NULL,
      "requerNivel" nivel DEFAULT 'trainee' NOT NULL,
      "imagemUrl" VARCHAR(500),
      disponivel BOOLEAN DEFAULT true NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  // user_inventory
  await createTableIfNotExists('user_inventory', `
    CREATE TABLE user_inventory (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL,
      "itemId" INTEGER NOT NULL,
      "dataCompra" TIMESTAMP DEFAULT NOW() NOT NULL,
      equipado BOOLEAN DEFAULT false NOT NULL
    )
  `);
  
  // dicoin_transactions
  await createTableIfNotExists('dicoin_transactions', `
    CREATE TABLE dicoin_transactions (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL,
      tipo dicoin_tipo NOT NULL,
      valor INTEGER NOT NULL,
      motivo VARCHAR(255) NOT NULL,
      "tarefaId" INTEGER,
      timestamp TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  // feed_eventos
  await createTableIfNotExists('feed_eventos', `
    CREATE TABLE feed_eventos (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL,
      tipo feed_evento_tipo NOT NULL,
      conteudo JSON,
      timestamp TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  // feed_reactions
  await createTableIfNotExists('feed_reactions', `
    CREATE TABLE feed_reactions (
      id SERIAL PRIMARY KEY,
      "eventoId" INTEGER NOT NULL,
      "userId" INTEGER NOT NULL,
      emoji VARCHAR(10) NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  // leads
  await createTableIfNotExists('leads', `
    CREATE TABLE leads (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      email VARCHAR(320) NOT NULL,
      telefone VARCHAR(20),
      empresa VARCHAR(255),
      cargo VARCHAR(100),
      linkedin VARCHAR(500),
      cpf VARCHAR(20),
      origem canal_origem NOT NULL,
      "utmSource" VARCHAR(100),
      "utmMedium" VARCHAR(100),
      "utmCampaign" VARCHAR(100),
      status lead_status DEFAULT 'prospecto' NOT NULL,
      "dataCaptura" TIMESTAMP DEFAULT NOW() NOT NULL,
      "campanhaId" INTEGER,
      observacoes TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  // campanhas
  await createTableIfNotExists('campanhas', `
    CREATE TABLE campanhas (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      descricao TEXT,
      tipo tipo_campanha NOT NULL,
      "dataInicio" TIMESTAMP NOT NULL,
      "dataFim" TIMESTAMP,
      "budgetTotal" DECIMAL(10, 2),
      objetivo VARCHAR(255),
      status VARCHAR(50) DEFAULT 'ativa' NOT NULL,
      metricas JSON,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await sql.end();
  console.log("\n✅ Setup do banco concluído!");
  
} catch (error) {
  console.error("❌ Erro durante setup:");
  console.error(`  ${error.message}`);
  console.error("  Stack:", error.stack);
  
  // Don't exit with error - let the app try to start anyway
  console.log("\n⚠️  Continuando mesmo com erro de migration...");
}
