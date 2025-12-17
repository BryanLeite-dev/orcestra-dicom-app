CREATE TYPE "canal_origem" AS ENUM('google_ads', 'linkedin', 'instagram', 'ebook', 'organico_linkedin', 'referral', 'direto');--> statement-breakpoint
CREATE TYPE "lead_status" AS ENUM('prospecto', 'qualificado', 'proposta', 'cliente', 'perdido');--> statement-breakpoint
CREATE TYPE "tipo_campanha" AS ENUM('google_ads', 'linkedin', 'email', 'ebook', 'evento', 'organico');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leads" (
	"id" serial PRIMARY KEY NOT NULL,
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
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campanhas" (
	"id" serial PRIMARY KEY NOT NULL,
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
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "metricas_diarias" (
	"id" serial PRIMARY KEY NOT NULL,
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
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"leadId" integer NOT NULL,
	"tipoConversao" varchar(100) NOT NULL,
	"dataCriacao" timestamp DEFAULT now() NOT NULL,
	"statusPipeline" varchar(50) NOT NULL,
	"valorEstimado" numeric(12, 2),
	"observacoes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conteudos" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"tipo" varchar(50) NOT NULL,
	"urlSlug" varchar(255) NOT NULL,
	"descricao" text,
	"ebook_downloads" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"engajamento" integer DEFAULT 0,
	"engajamentRate" numeric(5, 2) DEFAULT 0,
	"publicadoEm" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conteudos_urlSlug_unique" UNIQUE("urlSlug")
);--> statement-breakpoint
CREATE INDEX "leads_email_idx" ON "leads" ("email");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" ("status");--> statement-breakpoint
CREATE INDEX "leads_origem_idx" ON "leads" ("origem");--> statement-breakpoint
CREATE INDEX "metricas_diarias_data_idx" ON "metricas_diarias" ("data");--> statement-breakpoint
CREATE INDEX "metricas_diarias_canal_idx" ON "metricas_diarias" ("canal");--> statement-breakpoint
CREATE INDEX "conversoes_leadId_idx" ON "conversoes" ("leadId");--> statement-breakpoint
CREATE INDEX "conteudos_urlSlug_idx" ON "conteudos" ("urlSlug");
