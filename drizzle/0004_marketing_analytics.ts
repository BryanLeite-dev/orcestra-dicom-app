import { sql } from "drizzle-orm";

export async function up(db: any) {
  // Create enums
  await db.execute(
    sql`CREATE TYPE "canal_origem" AS ENUM('google_ads', 'linkedin', 'instagram', 'ebook', 'organico_linkedin', 'referral', 'direto')`
  );
  
  await db.execute(
    sql`CREATE TYPE "lead_status" AS ENUM('prospecto', 'qualificado', 'proposta', 'cliente', 'perdido')`
  );
  
  await db.execute(
    sql`CREATE TYPE "tipo_campanha" AS ENUM('google_ads', 'linkedin', 'email', 'ebook', 'evento', 'organico')`
  );

  // Create leads table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "leads" (
      "id" serial PRIMARY KEY,
      "nome" varchar(255) NOT NULL,
      "email" varchar(320) NOT NULL,
      "telefone" varchar(20),
      "empresa" varchar(255),
      "linkedin" varchar(500),
      "cpf" varchar(20),
      "origem" "canal_origem" NOT NULL,
      "utmSource" varchar(100),
      "utmMedium" varchar(100),
      "utmCampaign" varchar(100),
      "status" "lead_status" DEFAULT 'prospecto' NOT NULL,
      "dataCaptura" timestamp DEFAULT now() NOT NULL,
      "campanhaId" integer,
      "observacoes" text,
      "createdAt" timestamp DEFAULT now() NOT NULL,
      "updatedAt" timestamp DEFAULT now() NOT NULL
    )
  `);

  // Create campanhas table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "campanhas" (
      "id" serial PRIMARY KEY,
      "nome" varchar(255) NOT NULL,
      "descricao" text,
      "tipo" "tipo_campanha" NOT NULL,
      "dataInicio" timestamp NOT NULL,
      "dataFim" timestamp,
      "budgetTotal" numeric(10, 2),
      "objetivo" varchar(255),
      "status" varchar(50) DEFAULT 'ativa' NOT NULL,
      "metricas" json,
      "createdAt" timestamp DEFAULT now() NOT NULL,
      "updatedAt" timestamp DEFAULT now() NOT NULL
    )
  `);

  // Create metricas_diarias table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "metricas_diarias" (
      "id" serial PRIMARY KEY,
      "data" timestamp NOT NULL,
      "canal" "canal_origem" NOT NULL,
      "campanhaId" integer,
      "leadsGerados" integer DEFAULT 0 NOT NULL,
      "impressoes" integer DEFAULT 0 NOT NULL,
      "cliques" integer DEFAULT 0 NOT NULL,
      "conversoes" integer DEFAULT 0 NOT NULL,
      "gasto" numeric(10, 2) DEFAULT 0 NOT NULL,
      "receita" numeric(10, 2) DEFAULT 0,
      "observacoes" text,
      "createdAt" timestamp DEFAULT now() NOT NULL
    )
  `);

  // Create conversoes table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "conversoes" (
      "id" serial PRIMARY KEY,
      "leadId" integer NOT NULL,
      "tipoConversao" varchar(100) NOT NULL,
      "dataCriacao" timestamp DEFAULT now() NOT NULL,
      "statusPipeline" varchar(50) NOT NULL,
      "valorEstimado" numeric(12, 2),
      "observacoes" text,
      "createdAt" timestamp DEFAULT now() NOT NULL,
      "updatedAt" timestamp DEFAULT now() NOT NULL
    )
  `);

  // Create conteudos table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "conteudos" (
      "id" serial PRIMARY KEY,
      "titulo" varchar(255) NOT NULL,
      "tipo" varchar(50) NOT NULL,
      "urlSlug" varchar(255) NOT NULL UNIQUE,
      "descricao" text,
      "ebook_downloads" integer DEFAULT 0,
      "views" integer DEFAULT 0,
      "engajamento" integer DEFAULT 0,
      "engajamentRate" numeric(5, 2) DEFAULT 0,
      "publicadoEm" timestamp,
      "createdAt" timestamp DEFAULT now() NOT NULL,
      "updatedAt" timestamp DEFAULT now() NOT NULL
    )
  `);

  // Create indexes
  await db.execute(sql`CREATE INDEX "leads_email_idx" ON "leads" ("email")`);
  await db.execute(sql`CREATE INDEX "leads_status_idx" ON "leads" ("status")`);
  await db.execute(sql`CREATE INDEX "leads_origem_idx" ON "leads" ("origem")`);
  await db.execute(sql`CREATE INDEX "metricas_diarias_data_idx" ON "metricas_diarias" ("data")`);
  await db.execute(sql`CREATE INDEX "metricas_diarias_canal_idx" ON "metricas_diarias" ("canal")`);
  await db.execute(sql`CREATE INDEX "conversoes_leadId_idx" ON "conversoes" ("leadId")`);
  await db.execute(sql`CREATE INDEX "conteudos_urlSlug_idx" ON "conteudos" ("urlSlug")`);
}

export async function down(db: PostgresDB) {
  // Drop tables
  await db.execute(sql`DROP TABLE IF NOT EXISTS "conteudos"`);
  await db.execute(sql`DROP TABLE IF NOT EXISTS "conversoes"`);
  await db.execute(sql`DROP TABLE IF NOT EXISTS "metricas_diarias"`);
  await db.execute(sql`DROP TABLE IF NOT EXISTS "campanhas"`);
  await db.execute(sql`DROP TABLE IF NOT EXISTS "leads"`);

  // Drop enums
  await db.execute(sql`DROP TYPE IF EXISTS "tipo_campanha"`);
  await db.execute(sql`DROP TYPE IF EXISTS "lead_status"`);
  await db.execute(sql`DROP TYPE IF EXISTS "canal_origem"`);
}

export async function down(db: any) {
  // Rollback if needed
}
